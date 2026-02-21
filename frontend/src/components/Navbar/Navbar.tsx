import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDashboardData } from '../../contexts/DashboardDataContext'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  IconDashboard,
  IconPainel,
  IconProjetos,
  IconTasks,
  IconRelatorios,
  IconSearch,
} from './NavbarIcons'

const FAROL_ORDER = ['Problema Crítico', 'Com Problema', 'Sem Problema'] as const

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

function getLastName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? parts.slice(1).join(' ') : ''
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { dataUpdatedAt, searchQuery, setSearchQuery } = useDashboardData()
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const isDashboardPage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchInput.trim()
    setSearchQuery(q)
    if (q && !isDashboardPage) navigate(`/?q=${encodeURIComponent(q)}`)
    else if (q) navigate(`/?q=${encodeURIComponent(q)}`)
    setSearchInput('')
  }

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: IconDashboard },
    { path: '/serviceup', label: 'Painel Service UP', icon: IconPainel, serviceUpOnly: true },
    { path: '/projects/active', label: 'Projetos Ativos', icon: IconProjetos, adminOnly: true },
    { path: '/projects/completed', label: 'Projetos Concluídos', icon: IconProjetos, adminOnly: true },
    { path: '/tasks/active', label: "Task's Ativas", icon: IconTasks, adminOnly: true },
    { path: '/tasks/completed', label: "Task's Concluídas", icon: IconTasks, adminOnly: true },
    { path: '/reports', label: 'Relatórios', icon: IconRelatorios, adminOnly: true },
  ].filter((link) => {
    if ((link as { adminOnly?: boolean }).adminOnly) return isAuthenticated && user?.is_admin
    if ((link as { serviceUpOnly?: boolean }).serviceUpOnly) return isAuthenticated && user?.can_access_serviceup === true
    return true
  })

  const updatedText = dataUpdatedAt && isDashboardPage
    ? formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: ptBR })
    : null

  return (
    <nav
      className={`sticky top-0 z-50 transition-[height,box-shadow] duration-300 ${
        scrolled ? 'shadow-2xl' : 'shadow-lg'
      } bg-white/95 text-slate-800 dark:bg-slate-800/95 dark:text-white`}
      style={{
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        className={`w-full max-w-[1920px] mx-auto px-4 lg:px-6 transition-[height] duration-300 ${
          scrolled ? 'h-[68px]' : 'h-20'
        }`}
      >
        <div className="relative flex items-center justify-between h-full gap-2">
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform duration-300 hover:scale-[1.01] shrink-0 z-10"
          >
            <img
              src="/logo-qualiit.png"
              alt="Quali IT"
              className="h-9 lg:h-10 w-auto opacity-95 group-hover:opacity-100 transition-opacity"
            />
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1 rounded p-1 border border-white/20 bg-black/10 dark:bg-white/5">
                {FAROL_ORDER.map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full opacity-70 ${
                      s === 'Problema Crítico' ? 'bg-red-500' : s === 'Com Problema' ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                  />
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-base lg:text-lg font-bold tracking-tight font-heading">Farol Operacional</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-80">by Quali IT</span>
                  {updatedText && (
                    <span className="hidden lg:inline text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-white/90">
                      {updatedText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg transition-colors duration-300 ${
                    isActive ? 'font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon />
                  <span className="text-[10px] lg:text-xs leading-tight text-center whitespace-nowrap">{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-current opacity-80" />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0 z-10">
            <form onSubmit={handleSearch} className="flex items-center gap-1">
                <div className="relative flex items-center rounded-lg overflow-hidden bg-slate-100 dark:bg-white/10">
                <span className="absolute left-2.5 text-slate-500 dark:text-slate-400 pointer-events-none">
                  <IconSearch />
                </span>
                <input
                  type="search"
                  value={searchInput || searchQuery}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar projetos, PMO..."
                  className="w-36 lg:w-44 pl-9 pr-8 py-1.5 text-sm rounded-lg border-0 bg-transparent text-slate-800 placeholder-slate-500 dark:text-white dark:placeholder-slate-400 focus:ring-1 focus:ring-white/30"
                  aria-label="Buscar"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSearchInput('')
                      if (location.pathname === '/') navigate('/', { replace: true })
                    }}
                    className="absolute right-2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-500"
                    title="Limpar busca"
                    aria-label="Limpar busca"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>

            <div className="w-px h-6 bg-current opacity-20" />

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
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

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 ml-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-slate-200 dark:bg-white/20"
                    title={user.name || user.email}
                  >
                    {getInitials(user.name || user.email)}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-sm font-semibold leading-tight">{getFirstName(user.name || user.email)}</div>
                    <div className="text-xs opacity-80 leading-tight">{getLastName(user.name || user.email) || (user.is_admin ? 'Administrador' : '')}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98]"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98] ml-2"
              >
                Entrar
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <span className={`block h-0.5 w-full bg-current transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 w-full bg-current transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-full bg-current transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 space-y-2 border-t border-current/10">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive ? 'font-semibold bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon />
                  {link.label}
                </Link>
              )
            })}
            <div className="flex items-center justify-between px-4 py-3 border-t border-current/10 mt-2">
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                {theme === 'light' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              {isAuthenticated ? (
                <button onClick={logout} className="px-4 py-2 rounded-lg text-sm font-medium">
                  Sair
                </button>
              ) : (
                <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium">
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
