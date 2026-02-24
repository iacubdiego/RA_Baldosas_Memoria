'use client'

import dynamic from 'next/dynamic'

// Importación dinámica porque A-Frame / AR.js manipulan el DOM directamente
// y no son compatibles con SSR
const LocationARScanner = dynamic(
  () => import('../../components/LocationARScanner'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--color-stone)',
          color: 'var(--color-parchment)',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            border: '3px solid rgba(255,255,255,0.15)',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        <p style={{ opacity: 0.7 }}>Cargando…</p>
      </div>
    ),
  }
)

export default function ScannerPage() {
  return (
    <>
      {/* Estilos globales para animaciones del scanner */}
      <style jsx global>{`
        @keyframes pulso {
          0%   { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Ocultar la navbar global en la pantalla del scanner */
        body > main + * .navbar,
        nav.navbar {
          display: none !important;
        }
      `}</style>

      <LocationARScanner />
    </>
  )
}
