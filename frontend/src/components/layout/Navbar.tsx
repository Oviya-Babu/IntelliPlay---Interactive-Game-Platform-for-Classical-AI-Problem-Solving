import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '@/providers/ThemeProvider'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Games', to: '/#games' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()

  return (
    <nav className="flex items-center justify-between px-8 h-[60px] bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] sticky top-0 z-[100]">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 no-underline">
        <span className="text-[22px] font-bold text-[var(--accent-light)] font-sans">
          ⬡ IntelliPlay
        </span>
      </Link>

      {/* Nav Links */}
      <ul className="flex gap-6 list-none m-0 p-0">
        {NAV_LINKS.map(link => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="no-underline text-sm font-medium transition-colors duration-200"
              style={{
                color: pathname === link.to ? 'var(--accent-light)' : 'var(--text-secondary)',
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="px-3 py-1.5 rounded-[var(--radius-md)] text-sm cursor-pointer transition-all duration-200"
        style={{
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
        }}
      >
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>
    </nav>
  )
}
