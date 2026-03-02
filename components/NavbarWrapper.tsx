'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NavbarWrapper() {
  const pathname = usePathname()
  const esHome = pathname === '/'

  const [visible, setVisible] = useState(esHome ? 0 : 1)

  useEffect(() => {
    if (!esHome) { setVisible(1); return }
    const t1 = setTimeout(() => setVisible(1), 2500)
    return () => clearTimeout(t1)
  }, [esHome])

  return (
    <nav
      className="navbar"
      style={esHome ? {
        maxHeight:  visible ? '200px' : '0',
        overflow:   visible ? 'visible' : 'hidden',
        opacity:    visible ? 1 : 0,
        transition: visible
          ? 'max-height 2.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.8s ease 0.2s'
          : 'none',
        background: 'transparent',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      } : undefined}
    >
      <div className="navbar-container">
        <div className="navbar-brand">
          <a href="/" className="navbar-logo-link" style={esHome ? { color: 'var(--color-stone)' } : undefined}>
            <img src="/images/logo_flores.png" alt="Pañuelo" className="navbar-logo" />
            <span className="navbar-title" style={esHome ? { color: 'var(--color-stone)' } : undefined}>Recorremos Memoria</span>
          </a>
        </div>
        {!esHome && (
          <div className="navbar-links">
            <a href="/scanner" className="navbar-link">Encontrar</a>
            <a href="/mapa"    className="navbar-link">Mapa</a>
          </div>
        )}
      </div>
    </nav>
  )
}
