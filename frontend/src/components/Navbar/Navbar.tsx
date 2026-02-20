import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { featuresApi } from '../../services/api'
import { normalizeFarolStatus, FarolStatus } from '../../utils/farol'

interface NavbarProps {
  farolStatus?: FarolStatus | null
}

export default function Navbar({ farolStatus: propFarolStatus }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Extrair ID da URL diretamente do pathname
  const featureIdMatch = location.pathname.match(/^\/features\/(\d+)/)
  const featureId = featureIdMatch ? featureIdMatch[1] : null

  // Verificar se estamos na página de detalhes da feature
  const isFeatureDetailsPage = location.pathname.startsWith('/features/') && !!featureId
  
  // Buscar farolStatus da feature atual APENAS se estivermos na página de detalhes
  // Usa a mesma queryKey que FeatureDetails para compartilhar o cache
  const { data: currentFeature, isLoading: isLoadingFeature } = useQuery({
    queryKey: ['feature', featureId],
    queryFn: () => featuresApi.get(Number(featureId)),
    enabled: isFeatureDetailsPage && !propFarolStatus && !!featureId,
    refetchOnMount: false, // Usar cache se já existir
    refetchOnWindowFocus: false,
  })

  // Determinar farolStatus: APENAS usar se estivermos na página de detalhes
  // prop > feature atual > null
  const farolStatus = isFeatureDetailsPage 
    ? (propFarolStatus || (currentFeature?.farol_status ? normalizeFarolStatus(currentFeature.farol_status) : null))
    : null
  
  // Debug: log para verificar se está detectando corretamente
  useEffect(() => {
    if (isFeatureDetailsPage) {
      const rawStatus = currentFeature?.farol_status
      const normalized = rawStatus ? normalizeFarolStatus(rawStatus) : null
      const willUseColor = isFeatureDetailsPage && normalized && normalized !== 'Indefinido'
      
      console.log('[Navbar] 🔍 Debug Farol:', {
        pathname: location.pathname,
        featureId: featureId,
        isFeatureDetailsPage,
        isLoading: isLoadingFeature,
        hasCurrentFeature: !!currentFeature,
        farol_status_raw: rawStatus,
        farol_status_normalized: normalized,
        finalFarolStatus: farolStatus,
        willUseFarolColor: willUseColor,
        currentFeatureFull: currentFeature ? {
          id: currentFeature.id,
          title: currentFeature.title,
          farol_status: currentFeature.farol_status
        } : null
      })
      
      if (willUseColor) {
        console.log('[Navbar] ✅ Aplicando cor do farol:', normalized)
      } else {
        console.log('[Navbar] ⚠️ NÃO aplicando cor do farol. Razão:', {
          isFeatureDetailsPage,
          hasNormalized: !!normalized,
          isIndefinido: normalized === 'Indefinido',
          hasPropFarolStatus: !!propFarolStatus
        })
      }
    } else {
      console.log('[Navbar] ℹ️ Não é página de detalhes, usando cor padrão')
    }
  }, [isFeatureDetailsPage, currentFeature, farolStatus, location.pathname, featureId, isLoadingFeature, propFarolStatus])

  // Buscar status do farol do dashboard se não fornecido
  const { data: featuresData } = useQuery({
    queryKey: ['features', 'all'],
    queryFn: () => featuresApi.list({ limit: 1000 }),
    enabled: !farolStatus && !currentFeature,
  })

  // Detectar scroll para efeito de navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Determinar cor da navbar baseada no farol
  const getNavbarColor = (): { bg: string; text: string } => {
    if (farolStatus && farolStatus !== 'Indefinido') {
      switch (farolStatus) {
        case 'Sem Problema':
          return {
            bg: 'bg-[#198754]',
            text: 'text-white'
          }
        case 'Com Problema':
          return {
            bg: 'bg-[#FFC107]',
            text: 'text-gray-900'
          }
        case 'Problema Crítico':
          return {
            bg: 'bg-[#DC3545]',
            text: 'text-white'
          }
        default:
          break
      }
    }

    // Cor padrão: azul (diferente do verde/teal da logo) - mesma para ambos os temas
    return {
      bg: 'bg-blue-600',
      text: 'text-white'
    }
  }

  // Toggle theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const navbarColors = getNavbarColor()

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/serviceup', label: 'Painel Service UP', serviceUpOnly: true },
    { path: '/projects/active', label: 'Projetos Ativos', adminOnly: true },
    { path: '/projects/completed', label: 'Projetos Concluídos', adminOnly: true },
    { path: '/tasks/active', label: "Task's Ativas", adminOnly: true },
    { path: '/tasks/completed', label: "Task's Concluídas", adminOnly: true },
    { path: '/reports', label: 'Relatórios', adminOnly: true },
  ].filter(link => {
    if (link.adminOnly) return isAuthenticated && user?.is_admin
    if (link.serviceUpOnly) return isAuthenticated && (user?.can_access_serviceup === true)
    return true
  })

  // Aplicar estilo glass com cores baseadas no farol APENAS na página de detalhes
  const getNavbarStyle = () => {
    // Só aplicar cores do farol se estivermos na página de detalhes E tivermos um farolStatus válido
    if (isFeatureDetailsPage && farolStatus && farolStatus !== 'Indefinido') {
      console.log('[Navbar] 🎨 Aplicando cor do farol:', farolStatus)
      
      switch (farolStatus) {
        case 'Sem Problema':
          return {
            background: 'linear-gradient(135deg, rgba(25, 135, 84, 0.85) 0%, rgba(25, 135, 84, 0.75) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)'
          }
        case 'Com Problema':
          return {
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.85) 0%, rgba(255, 193, 7, 0.75) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)'
          }
        case 'Problema Crítico':
          console.log('[Navbar] 🔴 Aplicando VERMELHO para Problema Crítico')
          return {
            background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.85) 0%, rgba(220, 53, 69, 0.75) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)'
          }
        default:
          console.log('[Navbar] ⚠️ FarolStatus não reconhecido:', farolStatus)
          break
      }
    }
    
    // Cor padrão: azul (diferente do verde/teal da logo) - mesma para ambos os temas
    // Usada quando NÃO estamos na página de detalhes ou quando farolStatus é Indefinido
    if (isFeatureDetailsPage) {
      console.log('[Navbar] ℹ️ Usando cor padrão (azul) porque:', {
        hasFarolStatus: !!farolStatus,
        isIndefinido: farolStatus === 'Indefinido',
        farolStatusValue: farolStatus
      })
    }
    
    return {
      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.85) 0%, rgba(29, 78, 216, 0.75) 100%)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)'
    }
  }

  return (
    <nav
      className={`${navbarColors.text} shadow-lg transition-all duration-500 sticky top-0 z-50 ${
        scrolled ? 'shadow-2xl' : ''
      }`}
      style={getNavbarStyle()}
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-18 gap-4">
          {/* Logo e Nome */}
          <Link
            to="/"
            className="flex items-center gap-3 group transition-all duration-300 hover:scale-105 shrink-0"
          >
            {/* Logo Quali IT */}
            <div className="relative flex-shrink-0">
              <img 
                src="/logo-qualiit.png" 
                alt="Quali IT Logo" 
                className="h-10 w-auto opacity-95 group-hover:opacity-100 transition-opacity duration-300"
              />
            </div>
            
            {/* Semáforo (Farol) */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 bg-black/20 dark:bg-white/10 rounded-lg p-1.5 border border-white/20">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-lg"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight">Farol Operacional</span>
                <span className="text-xs opacity-80 font-medium">by Quali IT</span>
              </div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-0.5 flex-nowrap">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-2.5 py-2 rounded-lg transition-all duration-300 font-medium text-xs lg:text-sm whitespace-nowrap ${
                    isActive
                      ? 'bg-white/25 backdrop-blur-sm text-white font-semibold shadow-lg'
                      : 'hover:bg-white/15 text-white/90 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
                  )}
                </Link>
              )
            })}

            {/* Separador */}
            <div className="w-px h-6 bg-white/20 mx-2"></div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-lg hover:bg-white/15 transition-all duration-300 group"
              title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            >
              <div className="relative">
                {theme === 'light' ? (
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="text-right hidden lg:block">
                  <div className="text-sm font-semibold">{user?.name || user?.email}</div>
                  {user?.is_admin && (
                    <div className="text-xs opacity-80">Administrador</div>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30 font-medium text-sm hover:shadow-lg hover:scale-105"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30 font-medium text-sm hover:shadow-lg hover:scale-105 ml-2"
              >
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/15 transition-all duration-300 relative"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <span
                className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}
              ></span>
              <span
                className={`block h-0.5 w-full bg-white transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              ></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 space-y-2 border-t border-white/20">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/25 backdrop-blur-sm font-semibold'
                      : 'hover:bg-white/15'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/20 mt-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-white/15 transition-all duration-200"
              >
                {theme === 'light' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                  Sair
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
