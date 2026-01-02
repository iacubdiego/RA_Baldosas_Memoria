'use client'

import { useEffect, useState } from 'react'

export default function ScannerPage() {
  const [checking, setChecking] = useState(true)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar permiso de cámara antes de redirigir
    async function checkCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        setHasPermission(true)
        // Redirigir al scanner HTML estático
        window.location.href = '/scanner.html'
      } catch (err) {
        setHasPermission(false)
        setChecking(false)
      }
    }

    checkCamera()
  }, [])

  if (checking && hasPermission === null) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        background: 'var(--color-stone)',
        color: 'var(--color-parchment)',
      }}>
        <div className="loading" style={{ 
          borderColor: 'var(--color-parchment)', 
          borderTopColor: 'var(--color-primary)' 
        }} />
        <p>Verificando permisos de cámara...</p>
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
        background: 'var(--color-parchment)',
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📷</div>
          <h1 style={{ 
            color: 'var(--color-stone)', 
            marginBottom: 'var(--space-md)',
            fontSize: '1.8rem',
          }}>
            Permiso de Cámara Requerido
          </h1>
          <p style={{
            color: 'var(--color-concrete)',
            marginBottom: 'var(--space-lg)',
            lineHeight: 1.6,
          }}>
            Para escanear las baldosas necesitamos acceso a tu cámara. 
            Por favor, permite el acceso en la configuración de tu navegador.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
              }}
            >
              Reintentar
            </button>
            <a
              href="/"
              className="btn"
              style={{
                borderColor: 'var(--color-stone)',
                color: 'var(--color-stone)',
              }}
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Si tiene permiso, se redirige automáticamente
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-stone)',
      color: 'var(--color-parchment)',
    }}>
      <p>Cargando scanner AR...</p>
    </div>
  )
}
