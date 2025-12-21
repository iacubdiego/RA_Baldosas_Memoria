'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ARScanner = dynamic(
  () => import('@/components/ARScanner'),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-stone)',
        color: 'var(--color-parchment)',
      }}>
        <div className="stack" style={{ alignItems: 'center' }}>
          <div className="loading" style={{ borderColor: 'var(--color-parchment)', borderTopColor: 'var(--color-terracota)' }} />
          <p>Iniciando cámara AR...</p>
        </div>
      </div>
    )
  }
)

export default function ScannerPage() {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function checkCameraPermission() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        setPermissionGranted(true)
      } catch (err) {
        setError('Necesitamos acceso a tu cámara para escanear baldosas')
        setPermissionGranted(false)
      }
    }

    checkCameraPermission()
  }, [])

  if (permissionGranted === null) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-md)',
      }}>
        <div className="loading" />
        <p style={{ color: 'var(--color-dust)' }}>Verificando permisos...</p>
      </div>
    )
  }

  if (!permissionGranted) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h1 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-terracota)' }}>
            📷 Permiso de Cámara Requerido
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--color-concrete)',
            marginBottom: 'var(--space-lg)',
          }}>
            {error}
          </p>
          <p style={{ color: 'var(--color-dust)', marginBottom: 'var(--space-md)' }}>
            Por favor, permite el acceso a la cámara en la configuración de tu navegador y recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn"
            style={{ background: 'var(--color-terracota)', color: 'white', border: 'none' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return <ARScanner />
}
