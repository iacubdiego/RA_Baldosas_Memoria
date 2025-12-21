import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Baldosas por la Memoria',
  description: 'Descubre las baldosas históricas de Buenos Aires a través de realidad aumentada',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2a2520',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <div className="grain-overlay" />
        
        <nav style={{
          background: 'var(--color-stone)',
          color: 'var(--color-parchment)',
          padding: 'var(--space-sm) var(--space-md)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '2px solid var(--color-terracota)',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <a href="/" style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-parchment)',
              letterSpacing: '-0.02em',
            }}>
              Baldosas por la Memoria
            </a>
            
            <div style={{
              display: 'flex',
              gap: 'var(--space-md)',
              alignItems: 'center',
            }}>
              <a href="/mapa" style={{
                color: 'var(--color-parchment)',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}>
                Mapa
              </a>
              <a href="/scanner" style={{
                color: 'var(--color-parchment)',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}>
                Escanear
              </a>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer style={{
          background: 'var(--color-stone)',
          color: 'var(--color-dust)',
          padding: 'var(--space-xl) var(--space-md) var(--space-lg)',
          marginTop: 'var(--space-xl)',
          borderTop: '2px solid var(--color-terracota)',
        }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              margin: 0,
            }}>
              Un proyecto de memoria colectiva y cooperativismo
            </p>
            <p style={{
              fontSize: '0.85rem',
              marginTop: 'var(--space-xs)',
              opacity: 0.7,
            }}>
              © {new Date().getFullYear()} Baldosas por la Memoria
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
