import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { featuresApi } from '../../services/api'
import { normalizeFarolStatus, FarolStatus } from '../../utils/farol'

interface NavbarProps {
  farolStatus?: FarolStatus | null
}

export default function Navbar({ farolStatus }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Buscar status do farol se não fornecido
  const { data: featuresData } = useQuery({
    queryKey: ['features', 'all'],
    queryFn: () => featuresApi.list({ limit: 1000 }),
    enabled: !farolStatus,
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
  const getNavbarColor = (): string => {
    if (farolStatus) {
      switch (farolStatus) {
        case 'Sem Problema':
          return 'bg-gradient-to-r from-green-500 to-green-600'
        case 'Com Problema':
          return 'bg-gradient-to-r from-yellow-500 to-yellow-600'
        case 'Problema Crítico':
          return 'bg-gradient-to-r from-quali-red-500 to-quali-red-600'
        default:
          return 'bg-gradient-to-r from-quali-red-500 to-quali-red-600'
      }
    }

    // Se não há farolStatus, buscar do dashboard
    if (featuresData?.items) {
      const items = featuresData.items
      const criticalCount = items.filter(
        (item) => normalizeFarolStatus(item.farol_status) === 'Problema Crítico'
      ).length
      const problemCount = items.filter(
        (item) => normalizeFarolStatus(item.farol_status) === 'Com Problema'
      ).length

      if (criticalCount > 0) return 'bg-gradient-to-r from-quali-red-500 to-quali-red-600'
      if (problemCount > 0) return 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    }

    return 'bg-gradient-to-r from-quali-red-500 to-quali-red-600'
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

  const navbarColor = getNavbarColor()

  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/serviceup', label: 'Painel Service UP' },
    { path: '/projects/active', label: 'Projetos Ativos', adminOnly: true },
    { path: '/projects/completed', label: 'Projetos Concluídos', adminOnly: true },
    { path: '/reports', label: 'Relatórios', adminOnly: true },
  ].filter(link => !link.adminOnly || (isAuthenticated && user?.is_admin))

  // A navbar sempre usa cores escuras (vermelho, verde, amarelo), então o texto branco está correto
  // Mas vamos garantir que o contraste seja bom em todos os casos
  return (
    <nav
      className={`${navbarColor} text-white shadow-lg transition-all duration-500 sticky top-0 z-50 ${
        scrolled ? 'shadow-2xl backdrop-blur-md bg-opacity-95' : ''
      }`}
      style={{ color: '#FFFFFF' }}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo e Nome */}
          <Link
            to="/"
            className="flex items-center gap-3 group transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              {/* Logo Quali IT */}
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all duration-300 overflow-hidden">
                <svg width="32" height="32" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1">
                  <text x="5" y="28" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="white">QUALI</text>
                  <text x="68" y="28" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="white">IT</text>
                </svg>
              </div>
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/10 transition-all duration-300 blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">Farol Operacional</span>
              <span className="text-xs opacity-80 font-medium">by Quali IT</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm ${
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
