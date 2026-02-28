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
      } : undefined}
    >
      <div className="navbar-container">
        <div className="navbar-brand">
          <a href="/" className="navbar-logo-link">
            <img src="/images/logo_flores.png" alt="Pañuelo" className="navbar-logo" />
            <span className="navbar-title">Recorremos Memoria</span>
          </a>
        </div>
        <div className="navbar-links">
          <a href="/scanner"   className="navbar-link">Encontrar</a>
          <a href="/mapa"      className="navbar-link">Mapa</a>
        </div>
      </div>
    </nav>
  )
}
