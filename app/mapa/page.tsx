'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Importar Leaflet dinámicamente para evitar SSR issues
const MapComponent = dynamic(
  () => import('@/components/MapView'),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-parchment)',
      }}>
        <div className="loading" />
      </div>
    )
  }
)

export default function MapaPage() {
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener ubicación del usuario
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLoading(false)
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error)
          // Fallback a centro de Buenos Aires
          setUserLocation({
            lat: -34.6037,
            lng: -58.3816,
          })
          setError('No se pudo obtener tu ubicación. Mostrando centro de Buenos Aires.')
          setLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    } else {
      setUserLocation({
        lat: -34.6037,
        lng: -58.3816,
      })
      setError('Tu navegador no soporta geolocalización.')
      setLoading(false)
    }
  }, [])

  if (loading || !userLocation) {
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
        <p style={{ color: 'var(--color-dust)' }}>Obteniendo tu ubicación...</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {error && (
        <div style={{
          position: 'absolute',
          top: 'var(--space-md)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-terracota)',
          color: 'var(--color-parchment)',
          padding: 'var(--space-sm) var(--space-md)',
          borderRadius: '4px',
          zIndex: 1000,
          maxWidth: '90%',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}
      <MapComponent initialLocation={userLocation} />
    </div>
  )
}
