'use client'

import dynamic from 'next/dynamic'

const MapComponent = dynamic(
  () => import('@/components/MapView'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width:           '100%',
        height:          '100%',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        background:      'var(--color-parchment)',
      }}>
        <div className="loading" />
      </div>
    )
  }
)

export default function MapaPage() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapComponent initialLocation={{ lat: -34.6037, lng: -58.3816 }} />
    </div>
  )
}
