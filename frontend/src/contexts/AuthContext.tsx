import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  email: string
  name: string
  is_admin: boolean
  can_access_serviceup?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: () => void
  devLogin: () => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const validateToken = async (tokenToValidate: string): Promise<void> => {
    try {
      console.log('[Auth] 🔍 Validando token...')
      console.log('[Auth] Token (primeiros 50 chars):', tokenToValidate.substring(0, 50) + '...')
      
      // Intermitência: em alguns cenários o backend pode responder 500 no primeiro request logo após o login.
      // Fazemos até 2 tentativas com backoff curto antes de falhar.
      let lastError: any = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await axios.get('/api/auth/me', {
            params: { token: tokenToValidate },
            timeout: 10000, // 10 segundos de timeout
          })

          console.log('[Auth] ✅ Token válido, usuário:', response.data)
          setUser(response.data)
          setToken(tokenToValidate)
          setIsLoading(false)
          return
        } catch (err: any) {
          lastError = err
          const status = err.response?.status
          const code = err.code

          // Não retry para 401 (token inválido) ou 403
          // Também não tratar 429 como erro de autenticação
          if (status === 401 || status === 403) {
            throw err
          }
          
          // 429 (rate limit) não é erro de autenticação - não limpar token
          if (status === 429) {
            throw err
          }

          // Retry apenas para 500 e erros de rede/timeout
          const isRetryable =
            status === 500 ||
            code === 'ECONNABORTED' ||
            code === 'ERR_NETWORK' ||
            code === 'ECONNREFUSED'

          if (!isRetryable || attempt === 2) {
            throw err
          }

          console.warn(`[Auth] ⚠️ Falha ao validar token (tentativa ${attempt}/2). Tentando novamente...`, {
            status,
            code,
          })
          await sleep(700)
        }
      }

      throw lastError
      
    } catch (error: any) {
      console.error('[Auth] ❌ Erro ao validar token:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      })
      
      // Se for erro 500, pode ser problema no backend
      if (error.response?.status === 500) {
        console.error('[Auth] ⚠️ Erro 500 do servidor - possível problema de configuração')
        console.error('[Auth] Detalhes:', error.response?.data)
      }
      
      // 429 (rate limit) não é erro de autenticação - não limpar token
      if (error.response?.status === 429) {
        console.warn('[Auth] ⚠️ Rate limit - não é erro de autenticação')
        setIsLoading(false)
        throw error
      }
      
      // Apenas limpar token para erros de autenticação (401, 403)
      // Outros erros (500, network) não devem limpar o token
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('[Auth] ⚠️ Token inválido ou sem permissão - limpando token')
        localStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
      }
      
      setIsLoading(false)
      throw error // Re-throw para permitir tratamento no catch
    }
  }

  useEffect(() => {
    // Verificar token no localStorage
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
      // Validar token com backend
      validateToken(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const returnOrigin = origin ? `?return_origin=${encodeURIComponent(origin)}` : ''
    // Redireciona para o backend diretamente (evita 404 quando proxy falha)
    const apiBase = import.meta.env.VITE_API_BASE_URL
      ?? (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:8000'
        : '')
    const base = apiBase || (typeof window !== 'undefined' ? window.location.origin : '')
    window.location.href = `${base}/api/auth/login${returnOrigin}`
  }

  const devLogin = async () => {
    // Login temporário como admin (apenas desenvolvimento)
    try {
      console.log('[Auth] Fazendo requisição para /api/auth/dev-login...')
      setIsLoading(true)
      
      const response = await axios.get('/api/auth/dev-login', {
        timeout: 5000, // 5 segundos de timeout
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      console.log('[Auth] Resposta recebida:', { 
        hasToken: !!response.data?.token, 
        hasUser: !!response.data?.user 
      })
      
      const { token, user } = response.data
      
      if (!token || !user) {
        throw new Error('Resposta inválida: token ou usuário não encontrado')
      }
      
      localStorage.setItem('auth_token', token)
      setToken(token)
      setUser(user)
      setIsLoading(false)
      
      console.log('[Auth] Login temporário realizado com sucesso')
    } catch (error: any) {
      console.error('[Auth] Erro no login temporário:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      })
      setIsLoading(false)
      let errorMessage = 'Erro ao fazer login temporário. Verifique se o backend está rodando.'
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Backend não está disponível. Verifique se o servidor está rodando na porta 8000.'
      } else if (error.response?.status) {
        errorMessage = `Erro do servidor: ${error.response.status} - ${error.response.statusText || 'Erro desconhecido'}`
      } else if (error.message) {
        errorMessage = error.message
      }
      alert(errorMessage)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  // Verificar se há token na URL (callback OAuth)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')
    if (tokenFromUrl) {
      console.log('[Auth] 🔑 Token encontrado na URL, processando...')
      console.log('[Auth] URL atual:', window.location.href)
      setIsLoading(true)
      
      // Salvar token primeiro
      localStorage.setItem('auth_token', tokenFromUrl)
      setToken(tokenFromUrl)
      console.log('[Auth] ✅ Token salvo no localStorage')
      
      // Validar token de forma assíncrona
      validateToken(tokenFromUrl)
        .then(() => {
          console.log('[Auth] ✅ Token da URL validado com sucesso')
          // Limpar URL após processar
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
          console.log('[Auth] ✅ URL limpa:', newUrl)
        })
        .catch((error) => {
          console.error('[Auth] ❌ Erro ao validar token da URL:', error)
          console.error('[Auth] Detalhes do erro:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          })
          // Se falhar, redirecionar para login após um delay
          setTimeout(() => {
            const errorMsg = error.response?.data?.detail || error.message || 'Token inválido'
            window.location.href = `/login?error=${encodeURIComponent(errorMsg)}`
          }, 2000)
        })
    } else {
      console.log('[Auth] ℹ️ Nenhum token na URL')
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        devLogin,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

