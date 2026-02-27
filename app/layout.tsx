import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'

export const metadata: Metadata = {
  title: 'Recorremos Memoria',
  description: 'Descubre baldosas geolocalizadas a través de realidad aumentada',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a2a3a',
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

        <NavbarWrapper />

        <main>{children}</main>

        <footer style={{
          background:  'var(--color-stone)',
          color:       'var(--color-dust)',
          padding:     'var(--space-xl) var(--space-md) var(--space-lg)',
          marginTop:   'var(--space-xl)',
          borderTop:   '2px solid var(--color-primary)',
        }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize:   '0.9rem',
              margin:      0,
              color:      'var(--color-parchment)',
              opacity:     0.9,
            }}>
              Un proyecto de memoria colectiva y cooperativismo
            </p>
            <p style={{
              fontSize:  '0.85rem',
              marginTop: 'var(--space-xs)',
              opacity:    0.6,
              color:     'var(--color-parchment)',
            }}>
              © {new Date().getFullYear()} Recorremos Memoria
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
