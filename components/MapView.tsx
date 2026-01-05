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

// Icono personalizado para baldosas
const baldosaIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="#2563eb"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <circle cx="16" cy="16" r="4" fill="#2563eb"/>
    </svg>
  `),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
})

// Icono para ubicación del usuario
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="white" stroke-width="3"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Radio máximo para escanear (debe coincidir con scanner.html)
const RADIO_MAXIMO = 100; // metros

interface Baldosa {
  id: string
  nombre: string
  categoria: string
  lat: number
  lng: number
  direccion?: string
  barrio?: string
  mensajeAR: string
  descripcion?: string
}

interface MapViewProps {
  initialLocation: { lat: number; lng: number }
}

// Calcular distancia entre dos puntos
function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Formatear distancia
function formatearDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros)} metros`;
  }
  return `${(metros / 1000).toFixed(1)} km`;
}

function MapUpdater({ baldosas }: { baldosas: Baldosa[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (baldosas.length > 0) {
      const bounds = L.latLngBounds(
        baldosas.map(b => [b.lat, b.lng] as [number, number])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [baldosas, map])
  
  return null
}

export default function MapView({ initialLocation }: MapViewProps) {
  const [baldosas, setBaldosas] = useState<Baldosa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBaldosa, setSelectedBaldosa] = useState<Baldosa | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(true)

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLoadingLocation(false);
    }
  }, []);

  // Cargar baldosas
  useEffect(() => {
    async function fetchBaldosas() {
      try {
        const response = await fetch('/api/baldosas')
        const data = await response.json()
        
        if (data.error) {
          setError(data.error)
        } else {
          setBaldosas(data.baldosas || [])
        }
      } catch (err) {
        console.error('Error cargando baldosas:', err)
        setError('Error al cargar las baldosas')
      } finally {
        setLoading(false)
      }
    }

    fetchBaldosas()
  }, [])

  // Calcular distancia a una baldosa
  const getDistanciaBaldosa = (baldosa: Baldosa): number | null => {
    if (!userLocation) return null;
    return calcularDistancia(userLocation.lat, userLocation.lng, baldosa.lat, baldosa.lng);
  }

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer
        center={[userLocation?.lat || initialLocation.lat, userLocation?.lng || initialLocation.lng]}
        zoom={13}
        style={{ height: 'calc(100vh - 120px)', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marcador de ubicación del usuario */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div style={{ fontFamily: 'sans-serif', textAlign: 'center' }}>
                <strong>Tu ubicación</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {baldosas.map((baldosa) => {
          const distancia = getDistanciaBaldosa(baldosa);
          const estaCerca = distancia !== null && distancia <= RADIO_MAXIMO;
          
          return (
            <Marker
              key={baldosa.id}
              position={[baldosa.lat, baldosa.lng]}
              icon={baldosaIcon}
              eventHandlers={{
                click: () => setSelectedBaldosa(baldosa),
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'sans-serif', minWidth: '220px' }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    marginBottom: '5px',
                    color: '#1a2a3a',
                    fontWeight: 600,
                  }}>
                    {baldosa.nombre}
                  </h3>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#2563eb',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}>
                    {baldosa.categoria}
                  </p>
                  {baldosa.direccion && (
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#4a6b7c',
                      marginBottom: '10px',
                    }}>
                      📍 {baldosa.direccion}
                    </p>
                  )}
                  
                  {/* Mostrar distancia */}
                  {distancia !== null ? (
                    <div style={{
                      padding: '10px',
                      background: estaCerca ? '#dcfce7' : '#f3f4f6',
                      borderRadius: '6px',
                      marginTop: '10px',
                      textAlign: 'center',
                    }}>
                      <p style={{
                        fontSize: '0.85rem',
                        color: estaCerca ? '#166534' : '#6b7280',
                        margin: 0,
                      }}>
                        {estaCerca ? '✓ Estás cerca - Usá "Encontrar" para escanear' : '📏 Estás a'}
                      </p>
                      {!estaCerca && (
                        <p style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          color: '#4b5563',
                          margin: '5px 0 0 0',
                        }}>
                          {formatearDistancia(distancia)}
                        </p>
                      )}
                    </div>
                  ) : loadingLocation ? (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center', marginTop: '10px' }}>
                      Obteniendo ubicación...
                    </p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapUpdater baldosas={baldosas} />
      </MapContainer>

      {/* Panel lateral */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '320px',
        maxWidth: '100%',
        height: 'calc(100vh - 120px)',
        background: 'white',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        overflowY: 'auto',
        zIndex: 1000,
        padding: '20px',
      }}>
        <h2 style={{
          fontSize: '1.4rem',
          marginBottom: '15px',
          color: '#1a2a3a',
          fontWeight: 600,
        }}>
          Baldosas de la Memoria
        </h2>
        
        {/* Info de ubicación */}
        {userLocation && (
          <div style={{
            padding: '10px',
            background: '#f0f9ff',
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '0.85rem',
            color: '#0369a1',
          }}>
            📍 Tu ubicación detectada
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="loading" />
            <p style={{ marginTop: '10px', color: '#4a6b7c' }}>Cargando baldosas...</p>
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            background: '#fef2f2',
            borderRadius: '8px',
            color: '#dc2626',
          }}>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
          </div>
        ) : baldosas.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            background: '#f0f4f8',
            borderRadius: '8px',
          }}>
            <p style={{ color: '#4a6b7c', marginBottom: '10px' }}>
              No hay baldosas cargadas en el sistema
            </p>
            <a 
              href="/colaborar"
              style={{
                color: '#2563eb',
                textDecoration: 'underline',
              }}
            >
              ¿Conocés una baldosa? Colaborá
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#4a6b7c',
              marginBottom: '5px',
            }}>
              {baldosas.length} baldosa{baldosas.length !== 1 ? 's' : ''} encontrada{baldosas.length !== 1 ? 's' : ''}
            </p>
            
            {baldosas.map((baldosa) => {
              const distancia = getDistanciaBaldosa(baldosa);
              const estaCerca = distancia !== null && distancia <= RADIO_MAXIMO;
              
              return (
                <div
                  key={baldosa.id}
                  onClick={() => setSelectedBaldosa(baldosa)}
                  style={{
                    padding: '15px',
                    border: selectedBaldosa?.id === baldosa.id 
                      ? '2px solid #2563eb' 
                      : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedBaldosa?.id === baldosa.id 
                      ? 'rgba(37, 99, 235, 0.05)' 
                      : 'white',
                  }}
                >
                  <h3 style={{
                    fontSize: '1rem',
                    marginBottom: '5px',
                    color: '#1a2a3a',
                    fontWeight: 600,
                  }}>
                    {baldosa.nombre}
                  </h3>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#2563eb',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '5px',
                  }}>
                    {baldosa.categoria}
                  </p>
                  {distancia !== null && (
                    <p style={{
                      fontSize: '0.85rem',
                      color: estaCerca ? '#166534' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      {estaCerca ? '✓' : '📏'} {formatearDistancia(distancia)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Estilos para responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="position: absolute"][style*="right: 0"] {
            position: fixed !important;
            bottom: 0 !important;
            top: auto !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: 40vh !important;
            border-radius: 20px 20px 0 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
