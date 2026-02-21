import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useFarolNavbar } from '../../contexts/FarolNavbarContext'
import { useQuery } from '@tanstack/react-query'
import { featuresApi } from '../../services/api'
import { normalizeFarolStatus, FarolStatus } from '../../utils/farol'

interface NavbarProps {
  farolStatus?: FarolStatus | null
}

const FAROL_ORDER: FarolStatus[] = ['Problema Crítico', 'Com Problema', 'Sem Problema']

export default function Navbar({ farolStatus: propFarolStatus }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const { farolStatus: dashboardFarol } = useFarolNavbar()
  const location = useLocation()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const featureIdMatch = location.pathname.match(/^\/features\/(\d+)/)
  const featureId = featureIdMatch ? featureIdMatch[1] : null
  const isFeatureDetailsPage = location.pathname.startsWith('/features/') && !!featureId
  const isDashboardPage = location.pathname === '/'

  const { data: currentFeature } = useQuery({
    queryKey: ['feature', featureId],
    queryFn: () => featuresApi.get(Number(featureId)),
    enabled: isFeatureDetailsPage && !propFarolStatus && !!featureId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const farolStatus = isFeatureDetailsPage
    ? (propFarolStatus || (currentFeature?.farol_status ? normalizeFarolStatus(currentFeature.farol_status) : null))
    : isDashboardPage
      ? dashboardFarol
      : null

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getNavbarStyle = (): React.CSSProperties => {
    const applyFarol = (farolStatus && farolStatus !== 'Indefinido') && (isFeatureDetailsPage || isDashboardPage)
    if (applyFarol) {
      switch (farolStatus) {
        case 'Sem Problema':
          return {
            background: 'linear-gradient(135deg, rgba(25, 135, 84, 0.9) 0%, rgba(25, 135, 84, 0.78) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)',
          }
        case 'Com Problema':
          return {
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.92) 0%, rgba(217, 119, 6, 0.85) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '2px solid rgba(0, 0, 0, 0.15)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)',
          }
        case 'Problema Crítico':
          return {
            background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.9) 0%, rgba(185, 28, 28, 0.82) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)',
          }
        default:
          break
      }
    }

    return {
      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(29, 78, 216, 0.78) 100%)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)',
    }
  }

  const textClass = farolStatus === 'Com Problema' ? 'text-gray-900' : 'text-white'

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

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/serviceup', label: 'Painel Service UP', serviceUpOnly: true },
    { path: '/projects/active', label: 'Projetos Ativos', adminOnly: true },
    { path: '/projects/completed', label: 'Projetos Concluídos', adminOnly: true },
    { path: '/tasks/active', label: "Task's Ativas", adminOnly: true },
    { path: '/tasks/completed', label: "Task's Concluídas", adminOnly: true },
    { path: '/reports', label: 'Relatórios', adminOnly: true },
  ].filter((link) => {
    if (link.adminOnly) return isAuthenticated && user?.is_admin
    if (link.serviceUpOnly) return isAuthenticated && user?.can_access_serviceup === true
    return true
  })

  return (
    <nav
      className={`${textClass} sticky top-0 z-50 transition-[height,box-shadow] duration-300 ${
        scrolled ? 'shadow-2xl' : 'shadow-lg'
      }`}
      style={getNavbarStyle()}
    >
      <div
        className={`w-full max-w-[1920px] mx-auto px-4 lg:px-6 transition-[height] duration-300 ${
          scrolled ? 'h-14' : 'h-16'
        }`}
      >
        <div className="relative flex items-center justify-between h-full gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform duration-300 hover:scale-[1.02] shrink-0 z-10"
          >
            <div className="relative flex-shrink-0">
              <img
                src="/logo-qualiit.png"
                alt="Quali IT Logo"
                className="h-9 lg:h-10 w-auto opacity-95 group-hover:opacity-100 transition-opacity duration-300"
              />
            </div>

            <div className="flex items-center gap-3">
              <div
                className="flex flex-col gap-1.5 rounded-lg p-1.5 border border-white/25 bg-black/15"
                aria-label="Status do Farol"
              >
                {FAROL_ORDER.map((status) => {
                  const isActive = farolStatus === status
                  const colors = {
                    'Problema Crítico': 'bg-red-500',
                    'Com Problema': 'bg-amber-400',
                    'Sem Problema': 'bg-emerald-500',
                  }
                  return (
                    <div
                      key={status}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        isActive ? `${colors[status]} shadow-lg ring-2 ring-white/60 scale-110` : 'bg-white/30'
                      }`}
                      title={isActive ? status : undefined}
                    />
                  )
                })}
              </div>
              <div className="flex flex-col">
                <span className="text-base lg:text-lg font-bold tracking-tight font-heading">Farol Operacional</span>
                <span className="text-xs opacity-85 font-medium">by Quali IT</span>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3 py-2 rounded-lg transition-colors duration-300 font-medium text-xs lg:text-sm whitespace-nowrap ${
                    isActive ? 'font-semibold' : 'hover:bg-white/15'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="relative z-10">{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-1 shrink-0 z-10">
            <div className="w-px h-6 bg-white/25 mx-2" />
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-lg hover:bg-white/15 transition-colors duration-300 group"
              title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {theme === 'light' ? (
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="text-right hidden lg:block">
                  <div className="text-sm font-semibold">{user?.name || user?.email}</div>
                  {user?.is_admin && <div className="text-xs opacity-85">Administrador</div>}
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/25 hover:border-white/35 font-medium text-sm hover:shadow-lg active:scale-[0.98]"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/25 hover:border-white/35 font-medium text-sm hover:shadow-lg active:scale-[0.98] ml-2"
              >
                Entrar
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/15 transition-colors duration-300"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <span
                className={`block h-0.5 w-full bg-current transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
              <span
                className={`block h-0.5 w-full bg-current transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>

        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 space-y-2 border-t border-white/25">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-lg transition-colors duration-200 text-center ${
                    isActive ? 'bg-white/25 font-semibold' : 'hover:bg-white/15'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/25 mt-2">
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/15 transition-colors duration-200">
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
                <button onClick={logout} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 backdrop-blur-sm">
                  Sair
                </button>
              ) : (
                <Link to="/login" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 backdrop-blur-sm">
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
