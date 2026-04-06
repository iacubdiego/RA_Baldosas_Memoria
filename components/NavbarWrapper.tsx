'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

const LINKS = [
  { href: '/mapa',              label: 'Mapa' },
  { href: '/colaborar',          label: 'Colaborar' },
  { href: '/quienes-somos',     label: '¿Quiénes somos?' },
  { href: '/como-funciona',     label: '¿Cómo funciona?' },
]

export default function NavbarWrapper() {
  const pathname = usePathname()
  const esMapa = pathname === '/mapa'
  const esHome = pathname === '/'

  // En el mapa no se muestra la navbar — el mapa tiene su propia UI
  if (esMapa) return null

  const [visible, setVisible] = useState(esHome ? 0 : 1)

  // ── PWA install ───────────────────────────────────────────────────────────
  const [instalable, setInstalable]   = useState(false)
  const [esIOS, setEsIOS]             = useState(false)
  const [yaInstalada, setYaInstalada] = useState(false)
  const [tooltipIOS, setTooltipIOS]   = useState(false)
  const deferredPrompt = useRef<any>(null)
  const tooltipRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setEsIOS(ios)
    if (window.matchMedia('(display-mode: standalone)').matches) { setYaInstalada(true); return }
    if (ios) { setInstalable(true); return }
    const handler = (e: Event) => { e.preventDefault(); deferredPrompt.current = e; setInstalable(true) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstalable(false); setYaInstalada(true) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!tooltipIOS) return
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) setTooltipIOS(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tooltipIOS])

  const handleInstalar = async () => {
    if (esIOS) { setTooltipIOS(v => !v); return }
    if (!deferredPrompt.current) return
    deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') setInstalable(false)
    deferredPrompt.current = null
  }

  useEffect(() => {
    if (!esHome) { setVisible(1); return }
    const t = setTimeout(() => setVisible(1), 2500)
    return () => clearTimeout(t)
  }, [esHome])

  // Colores según contexto (home transparente / resto oscuro)
  const textColor   = esHome ? 'var(--color-stone)'    : 'var(--color-parchment)'
  const linkHoverBg = esHome ? 'rgba(26,42,58,0.08)'   : 'rgba(255,255,255,0.1)'
  const activeColor = esHome ? 'var(--color-primary)'  : 'white'

  return (
    <>
      <style>{`
        .rm-navbar {
          background: var(--color-stone);
          color: var(--color-parchment);
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 2px solid var(--color-primary);
          box-shadow: 0 4px 24px rgba(26,42,58,0.12);
        }
        .rm-navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.65rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .rm-logo-link {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          color: var(--color-parchment);
          flex-shrink: 0;
        }
        .rm-logo-link:hover { opacity: 0.88; color: var(--color-parchment); }
        .rm-logo-img { width: 38px; height: 38px; object-fit: contain; }
        .rm-logo-title {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }
        .rm-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          flex-wrap: nowrap;
        }
        .rm-link {
          color: rgba(240,244,248,0.8);
          font-size: 0.88rem;
          font-weight: 500;
          padding: 0.45rem 0.75rem;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.18s, color 0.18s;
          white-space: nowrap;
        }
        .rm-link:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .rm-link-active {
          color: white;
          background: rgba(255,255,255,0.12);
        }
        .rm-btn-instalar {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.42rem 0.8rem;
          background: rgba(255,255,255,0.1);
          color: var(--color-parchment);
          border: none;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-body);
          letter-spacing: 0.01em;
          transition: background 0.18s;
          text-transform: none;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .rm-btn-instalar:hover {
          background: rgba(255,255,255,0.2);
          transform: none;
          box-shadow: none;
          color: white;
        }

        /* ── Mobile: dos filas ── */
        @media (max-width: 640px) {
          .rm-navbar-inner {
            flex-wrap: wrap;
            padding: 0.6rem 1rem 0;
            gap: 0;
          }
          .rm-top-row {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 0.5rem;
          }
          .rm-links {
            width: 100%;
            justify-content: center;
            gap: 0;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 0.35rem 0 0.45rem;
            flex-wrap: wrap;
          }
          .rm-link {
            font-size: 0.82rem;
            padding: 0.35rem 0.6rem;
          }
          .rm-logo-title { font-size: 1.1rem; }
          .rm-logo-img { width: 32px; height: 32px; }
        }

        /* ── Desktop: una fila ── */
        @media (min-width: 641px) {
          .rm-top-row {
            display: contents;
          }
        }
      `}</style>

      <nav
        className="rm-navbar"
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
        <div className="rm-navbar-inner">

          {/* Fila superior (mobile) / contenido principal (desktop) */}
          <div className="rm-top-row">
            <a href="/" className="rm-logo-link"
              style={esHome ? { color: 'var(--color-stone)' } : undefined}
            >
              <img src="/images/logo_flores.png" alt="Inicio" className="rm-logo-img" />
              <span className="rm-logo-title"
                style={esHome ? { color: 'var(--color-stone)' } : undefined}
              >
                Recorremos Memoria
              </span>
            </a>

            {/* Botón instalar PWA — solo en mobile top row */}
            {instalable && !yaInstalada && (
              <div style={{ position: 'relative' }} ref={tooltipRef} className="rm-instalar-wrap">
                <button className="rm-btn-instalar"
                  onClick={handleInstalar}
                  style={esHome ? { color: 'var(--color-stone)', background: 'rgba(26,42,58,0.08)' } : undefined}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4M8 12l4 4 4-4"/><path d="M4 20h16"/>
                  </svg>
                  Instalar
                </button>

                {tooltipIOS && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: '240px', background: 'var(--color-stone)', color: 'var(--color-parchment)',
                    borderRadius: '12px', padding: '1rem', fontSize: '0.82rem', lineHeight: 1.5,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.35)', zIndex: 500,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{
                      position: 'absolute', top: '-6px', right: '18px',
                      width: '12px', height: '12px', background: 'var(--color-stone)',
                      transform: 'rotate(45deg)',
                      borderLeft: '1px solid rgba(255,255,255,0.1)',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}/>
                    <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>Agregar a inicio</p>
                    <p style={{ margin: 0, color: 'rgba(240,244,248,0.7)' }}>
                      Tocá el botón <strong style={{ color: 'var(--color-parchment)' }}>Compartir</strong> de Safari y elegí <strong style={{ color: 'var(--color-parchment)' }}>"Agregar a pantalla de inicio"</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Links de navegación */}
          <div className="rm-links">
            {LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className={`rm-link ${pathname === href ? 'rm-link-active' : ''}`}
                style={esHome ? { color: 'var(--color-stone)' } : undefined}
              >
                {label}
              </a>
            ))}
          </div>

        </div>
      </nav>
    </>
  )
}
