import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import FooterWrapper from '@/components/FooterWrapper'

export const metadata: Metadata = {
  title: 'Recorremos Memoria',
  description: 'Descubrí las baldosas por la memoria cerca tuyo con realidad aumentada',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Recorremos Memoria',
  },
  openGraph: {
    title: 'Recorremos Memoria',
    description: 'Descubrí las baldosas por la memoria cerca tuyo con realidad aumentada',
    images: ['/images/icon-512.png'],
  },
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
        {/* PWA — iOS */}
        <link rel="apple-touch-icon" href="/images/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/images/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Recorremos Memoria" />
      </head>
      <body>
        <div className="grain-overlay" />

        <NavbarWrapper />

        <main>{children}</main>

        <FooterWrapper />
      </body>
    </html>
  )
}