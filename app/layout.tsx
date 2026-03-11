import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import FooterWrapper from '@/components/FooterWrapper'

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

        <FooterWrapper />
      </body>
    </html>
  )
}