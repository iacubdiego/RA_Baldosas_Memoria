import type { Metadata, Viewport } from 'next'
import './globals.css'
import connectDB from '@/lib/mongodb'
import Baldosa from '@/models/Baldosa'

export const metadata: Metadata = {
  title: 'Baldosas por la Memoria',
  description: 'Descubre las baldosas históricas de Buenos Aires a través de realidad aumentada',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a2a3a',
}

// Revalida cada 60 segundos para que el contador se actualice
// sin reconstruir la página entera
export const revalidate = 60

async function contarBaldosas(): Promise<number> {
  try {
    await connectDB()
    return await Baldosa.countDocuments({ activo: true })
  } catch {
    return 0
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const totalBaldosas = await contarBaldosas()

  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <div className="grain-overlay" />
        
        <nav className="navbar">
          <div className="navbar-container">
            {/* Logo y título */}
            <div className="navbar-brand">
              <a href="/" className="navbar-logo-link">
                <img 
                  src="/panuelo-bg-sin-fondo.png" 
                  alt="Pañuelo" 
                  className="navbar-logo"
                />
                <span className="navbar-title">Baldosas por la Memoria</span>
              </a>
            </div>
            
            {/* Links + contador */}
            <div className="navbar-links">
              <a href="/scanner" className="navbar-link">
                Encontrar
              </a>
              <a href="/coleccion" className="navbar-link">
                Mi Recorrido
              </a>

              {/* Contador de baldosas */}
              {totalBaldosas > 0 && (
                <span
                  title={`${totalBaldosas} baldosas cargadas en la base`}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            '0.35rem',
                    background:     'rgba(255,255,255,0.10)',
                    border:         '1px solid rgba(255,255,255,0.18)',
                    borderRadius:   '20px',
                    padding:        '0.25rem 0.75rem',
                    fontSize:       '0.82rem',
                    fontWeight:     600,
                    color:          'var(--color-parchment)',
                    letterSpacing:  '0.02em',
                    whiteSpace:     'nowrap',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>🏛️</span>
                  {totalBaldosas.toLocaleString('es-AR')}
                </span>
              )}
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer style={{
          background: 'var(--color-stone)',
          color: 'var(--color-dust)',
          padding: 'var(--space-xl) var(--space-md) var(--space-lg)',
          marginTop: 'var(--space-xl)',
          borderTop: '2px solid var(--color-primary)',
        }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              margin: 0,
              color: 'var(--color-parchment)',
              opacity: 0.9,
            }}>
              Un proyecto de memoria colectiva y cooperativismo
            </p>
            {totalBaldosas > 0 && (
              <p style={{
                fontSize: '0.82rem',
                marginTop: 'var(--space-xs)',
                opacity: 0.55,
                color: 'var(--color-parchment)',
              }}>
                {totalBaldosas.toLocaleString('es-AR')} baldosas honran a víctimas de la dictadura (1976–1983)
              </p>
            )}
            <p style={{
              fontSize: '0.85rem',
              marginTop: 'var(--space-xs)',
              opacity: 0.6,
              color: 'var(--color-parchment)',
            }}>
              © {new Date().getFullYear()} Baldosas por la Memoria
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
