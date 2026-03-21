'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

export default function NavbarWrapper() {
  const pathname = usePathname()
  const esHome = pathname === '/'

  const [visible, setVisible] = useState(esHome ? 0 : 1)

  // ── PWA install ───────────────────────────────────────────────────────────
  const [instalable, setInstalable]     = useState(false)
  const [esIOS, setEsIOS]               = useState(false)
  const [yaInstalada, setYaInstalada]   = useState(false)
  const [tooltipIOS, setTooltipIOS]     = useState(false)
  const deferredPrompt = useRef<any>(null)
  const tooltipRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Detectar iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setEsIOS(ios)

    // Si ya está instalada como PWA (standalone), no mostrar el botón
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setYaInstalada(true)
      return
    }

    if (ios) {
      // En iOS no hay beforeinstallprompt — mostrar igual con instrucciones
      setInstalable(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e
      setInstalable(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Si el usuario instala, ocultar el botón
    window.addEventListener('appinstalled', () => {
      setInstalable(false)
      setYaInstalada(true)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Cerrar tooltip iOS al hacer click fuera
  useEffect(() => {
    if (!tooltipIOS) return
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltipIOS(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tooltipIOS])

  const handleInstalar = async () => {
    if (esIOS) {
      setTooltipIOS(v => !v)
      return
    }
    if (!deferredPrompt.current) return
    deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') setInstalable(false)
    deferredPrompt.current = null
  }

  // ── Animación home ────────────────────────────────────────────────────────
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

        {/* Botón instalar PWA — solo si es instalable y no está ya instalada */}
        {instalable && !yaInstalada && (
          <div style={{ position: 'relative' }} ref={tooltipRef}>
            <button
              onClick={handleInstalar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                background: 'rgba(255,255,255,0.12)',
                color: esHome ? 'var(--color-stone)' : 'var(--color-parchment)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.01em',
                transition: 'background 0.2s',
                textTransform: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M8 12l4 4 4-4"/>
                <path d="M4 20h16"/>
              </svg>
              Instalar app
            </button>

            {/* Tooltip para iOS */}
            {tooltipIOS && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '240px',
                background: 'var(--color-stone)',
                color: 'var(--color-parchment)',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                zIndex: 500,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {/* Flecha del tooltip */}
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '18px',
                  width: '12px',
                  height: '12px',
                  background: 'var(--color-stone)',
                  transform: 'rotate(45deg)',
                  borderLeft: '1px solid rgba(255,255,255,0.1)',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                }}/>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
                  Agregar a inicio
                </p>
                <p style={{ margin: 0, color: 'rgba(240,244,248,0.7)' }}>
                  Tocá el botón <strong style={{ color: 'var(--color-parchment)' }}>Compartir</strong> de Safari y elegí <strong style={{ color: 'var(--color-parchment)' }}>"Agregar a pantalla de inicio"</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
