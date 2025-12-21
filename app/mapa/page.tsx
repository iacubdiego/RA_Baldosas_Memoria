'use client'

import dynamic from 'next/dynamic'

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
  const fixedLocation = { lat: -34.6037, lng: -58.3816 }

  return (
    <div style={{ position: 'relative' }}>
      <MapComponent initialLocation={fixedLocation} />
    </div>
  )
}
