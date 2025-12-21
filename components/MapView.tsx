'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const baldosaIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#c86b3c" stroke="#2a2520" stroke-width="2"/>
      <circle cx="16" cy="16" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

interface Baldosa {
  id: string
  nombre: string
  categoria: string
  lat: number
  lng: number
  direccion?: string
  distancia: number
  mensajeAR: string
}

interface MapViewProps {
  initialLocation: { lat: number; lng: number }
}

function MapUpdater({ baldosas }: { baldosas: Baldosa[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (baldosas.length > 0) {
      const bounds = L.latLngBounds(
        baldosas.map(b => [b.lat, b.lng] as [number, number])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [baldosas, map])
  
  return null
}

export default function MapView({ initialLocation }: MapViewProps) {
  const [baldosas, setBaldosas] = useState<Baldosa[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBaldosa, setSelectedBaldosa] = useState<Baldosa | null>(null)

  useEffect(() => {
    async function fetchBaldosas() {
      try {
        const response = await fetch(
          `/api/baldosas/nearby?lat=${initialLocation.lat}&lng=${initialLocation.lng}&radius=10000`
        )
        const data = await response.json()
        setBaldosas(data.baldosas || [])
      } catch (error) {
        console.error('Error cargando baldosas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBaldosas()
  }, [initialLocation])

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={[initialLocation.lat, initialLocation.lng]}
        zoom={15}
        style={{ height: 'calc(100vh - 70px)', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {baldosas.map((baldosa) => (
          <Marker
            key={baldosa.id}
            position={[baldosa.lat, baldosa.lng]}
            icon={baldosaIcon}
            eventHandlers={{
              click: () => setSelectedBaldosa(baldosa),
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'var(--font-body)', minWidth: '200px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  marginBottom: 'var(--space-xs)',
                  color: 'var(--color-stone)',
                }}>
                  {baldosa.nombre}
                </h3>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-dust)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-xs)',
                }}>
                  {baldosa.categoria}
                </p>
                {baldosa.direccion && (
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-concrete)',
                    marginBottom: 'var(--space-sm)',
                  }}>
                    📍 {baldosa.direccion}
                  </p>
                )}
                <a
                  href={`/baldosa/${baldosa.id}`}
                  style={{
                    display: 'inline-block',
                    marginTop: 'var(--space-xs)',
                    padding: 'var(--space-xs) var(--space-sm)',
                    background: 'var(--color-terracota)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '2px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  Ver detalles
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapUpdater baldosas={baldosas} />
      </MapContainer>

      {/* Panel lateral */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '320px',
        maxWidth: '90vw',
        height: 'calc(100vh - 70px)',
        background: 'var(--color-parchment)',
        boxShadow: 'var(--shadow-strong)',
        overflowY: 'auto',
        zIndex: 1000,
        padding: 'var(--space-md)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          marginBottom: 'var(--space-md)',
          color: 'var(--color-stone)',
        }}>
          Baldosas de la Memoria
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div className="loading" />
          </div>
        ) : baldosas.length === 0 ? (
          <p style={{ color: 'var(--color-dust)', textAlign: 'center' }}>
            No hay baldosas cerca de tu ubicación
          </p>
        ) : (
          <div className="stack">
            {baldosas.map((baldosa) => (
              <div
                key={baldosa.id}
                onClick={() => setSelectedBaldosa(baldosa)}
                style={{
                  padding: 'var(--space-sm)',
                  border: selectedBaldosa?.id === baldosa.id 
                    ? '2px solid var(--color-terracota)' 
                    : '1px solid rgba(42, 37, 32, 0.1)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  background: selectedBaldosa?.id === baldosa.id 
                    ? 'rgba(200, 107, 60, 0.05)' 
                    : 'transparent',
                }}
              >
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  marginBottom: 'var(--space-xs)',
                }}>
                  {baldosa.nombre}
                </h3>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-dust)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {baldosa.categoria}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
