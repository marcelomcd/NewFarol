import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import FeaturesList from './components/FeaturesList/FeaturesList'
import FeatureDetails from './pages/FeatureDetails'
import Dashboard from './components/Dashboard/Dashboard'
import InteractiveDashboard from './components/Dashboard/InteractiveDashboard'
import Reports from './components/Reports/Reports'
import Login from './pages/Login'
import Navbar from './components/Navbar/Navbar'
import ActiveProjects from './pages/ActiveProjects'
import CompletedProjects from './pages/CompletedProjects'
import ServiceUp from './pages/ServiceUp'
import ErrorBoundary from './components/ErrorBoundary'
import { useEffect } from 'react'

function AuthSuccessRedirect() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    console.log('[AuthSuccessRedirect] 🔄 Estado:', { 
      isAuthenticated, 
      isLoading,
      currentUrl: window.location.href,
      hasToken: !!localStorage.getItem('auth_token')
    })
    
    // Aguardar processamento do token antes de redirecionar
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('[AuthSuccessRedirect] ✅ Autenticado, redirecionando para dashboard...')
        // Pequeno delay para garantir que o estado foi atualizado
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 300)
      } else {
        console.warn('[AuthSuccessRedirect] ⚠️ Não autenticado após processar token')
        console.warn('[AuthSuccessRedirect] Verificando token no localStorage...')
        const token = localStorage.getItem('auth_token')
        if (!token) {
          console.error('[AuthSuccessRedirect] ❌ Token não encontrado no localStorage!')
          setTimeout(() => {
            navigate('/login?error=Token não encontrado', { replace: true })
          }, 1000)
        } else {
          console.warn('[AuthSuccessRedirect] Token existe mas não foi validado. Aguardando...')
          // Aguardar mais um pouco caso a validação esteja em andamento
          setTimeout(() => {
            if (!isAuthenticated) {
              navigate('/login?error=Falha na validação do token', { replace: true })
            }
          }, 3000)
        }
      }
    }
  }, [isAuthenticated, isLoading, navigate])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Processando autenticação...</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          {isLoading ? 'Validando token...' : isAuthenticated ? 'Redirecionando...' : 'Aguardando...'}
        </p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Carregando...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Verificando autenticação...
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 max-w-md mx-auto">
            Se demorar muito, verifique se o backend está rodando na porta 8000. 
            Você será redirecionado para a página de login se necessário.
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/** Detecta se a app está rodando dentro de um iframe (evita navbar duplicada no Painel Service Up). */
function isEmbeddedInIframe(): boolean {
  if (typeof window === 'undefined') return false
  return window.self !== window.top
}

function App() {
  const { isAuthenticated } = useAuth()
  const showNavbar = isAuthenticated && !isEmbeddedInIframe()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      {showNavbar && <Navbar />}
      
      <main className={isAuthenticated ? "w-full px-2 py-8" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/auth/success"
            element={<AuthSuccessRedirect />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <InteractiveDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/serviceup"
            element={
              <ProtectedRoute>
                <ServiceUp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-old"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/features/:id"
            element={
              <ProtectedRoute>
                <FeatureDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/active"
            element={
              <ProtectedRoute>
                <ActiveProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/completed"
            element={
              <ProtectedRoute>
                <CompletedProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

