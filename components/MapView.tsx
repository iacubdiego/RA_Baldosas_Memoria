'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const baldosaIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="#2563eb"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <circle cx="16" cy="16" r="4" fill="#2563eb"/>
    </svg>
  `),
  iconSize:    [32, 40],
  iconAnchor:  [16, 40],
  popupAnchor: [0, -40],
})

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="white" stroke-width="3"/>
    </svg>
  `),
  iconSize:   [24, 24],
  iconAnchor: [12, 12],
})

const RADIO_MAXIMO = 100 // metros para considerar "cerca"

// ─── Tipos ────────────────────────────────────────────────────────────────────

// Pin mínimo para el mapa (viene de /api/baldosas/pins)
interface Pin {
  id:        string
  codigo:    string
  nombre:    string
  direccion: string
  barrio:    string
  lat:       number
  lng:       number
}

// Baldosa cercana con detalle (viene de /api/baldosas/nearby)
interface BaldosaCercana {
  id:        string
  codigo:    string
  nombre:    string
  lat:       number
  lng:       number
  direccion: string
  barrio:    string
  mensajeAR: string
  distancia?: number
}

interface MapViewProps {
  initialLocation: { lat: number; lng: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatearDistancia(metros: number): string {
  return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1)} km`
}

// Mueve el mapa para encuadrar todos los pins (solo al montar)
function MapFitter({ pins }: { pins: Pin[] }) {
  const map  = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (pins.length > 0 && !done.current) {
      done.current = true
      const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng] as [number, number]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [pins, map])
  return null
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MapView({ initialLocation }: MapViewProps) {
  // ── Estado del mapa (pins) ─────────────────────────────────────────────────
  const [pins,          setPins]          = useState<Pin[]>([])
  const [loadingPins,   setLoadingPins]   = useState(true)

  // ── Estado del panel (50 más cercanas) ────────────────────────────────────
  const [cercanas,         setCercanas]         = useState<BaldosaCercana[]>([])
  const [loadingCercanas,  setLoadingCercanas]  = useState(false)
  const [selectedId,       setSelectedId]       = useState<string | null>(null)

  // ── Ubicación del usuario ─────────────────────────────────────────────────
  const [userLocation,    setUserLocation]    = useState<{ lat: number; lng: number } | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(true)

  const panelRef = useRef<HTMLDivElement>(null)

  // ── 1. Pedir ubicación ────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setLoadingLocation(false); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoadingLocation(false)
      },
      () => setLoadingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // ── 2. Cargar pins mínimos para el mapa ───────────────────────────────────
  useEffect(() => {
    fetch('/api/baldosas/pins')
      .then(r => r.json())
      .then(d => setPins(d.pins || []))
      .catch(e => console.error('Error cargando pins:', e))
      .finally(() => setLoadingPins(false))
  }, [])

  // ── 3. Cargar las 50 más cercanas cuando hay ubicación ───────────────────
  useEffect(() => {
    if (!userLocation) return
    setLoadingCercanas(true)
    const { lat, lng } = userLocation
    fetch(`/api/baldosas/nearby?lat=${lat}&lng=${lng}&radius=5000`)
      .then(r => r.json())
      .then(d => {
        const lista: BaldosaCercana[] = (d.baldosas || []).map((b: any) => ({
          ...b,
          distancia: calcularDistancia(lat, lng, b.lat, b.lng),
        }))
        // Ordenar por distancia
        lista.sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0))
        setCercanas(lista)
      })
      .catch(e => console.error('Error cargando cercanas:', e))
      .finally(() => setLoadingCercanas(false))
  }, [userLocation])

  // ── 4. Sin ubicación: mostrar las primeras 50 pins en el panel ────────────
  useEffect(() => {
    if (userLocation || loadingLocation || pins.length === 0) return
    // Copia los primeros 50 pins como lista del panel (sin distancia)
    setCercanas(pins.slice(0, 50).map(p => ({ ...p, mensajeAR: '' })))
  }, [loadingLocation, userLocation, pins])

  const selectedPin = pins.find(p => p.id === selectedId) ?? null

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Mapa ──────────────────────────────────────────────────────────── */}
      <MapContainer
        center={[userLocation?.lat ?? initialLocation.lat, userLocation?.lng ?? initialLocation.lng]}
        zoom={13}
        style={{ height: 'calc(100vh - 120px)', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Ubicación del usuario */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div style={{ fontFamily: 'sans-serif', textAlign: 'center' }}>
                <strong>Tu ubicación</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Markers de baldosas — solo lat/lng/nombre/dirección */}
        {pins.map(pin => {
          const distancia = userLocation
            ? calcularDistancia(userLocation.lat, userLocation.lng, pin.lat, pin.lng)
            : null
          const cerca = distancia !== null && distancia <= RADIO_MAXIMO

          return (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={baldosaIcon}
              eventHandlers={{ click: () => setSelectedId(pin.id) }}
            >
              <Popup>
                <div style={{ fontFamily: 'sans-serif', minWidth: '200px' }}>
                  <h3 style={{ fontSize: '1rem', color: '#1a2a3a', marginBottom: '4px' }}>
                    {pin.nombre}
                  </h3>
                  {pin.direccion && (
                    <p style={{ fontSize: '0.85rem', color: '#4a6b7c', marginBottom: '8px' }}>
                      🌎 {pin.direccion}
                    </p>
                  )}
                  {distancia !== null && (
                    <div style={{
                      padding: '8px',
                      background: cerca ? '#dcfce7' : '#f3f4f6',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      color: cerca ? '#166534' : '#4b5563',
                    }}>
                      {cerca
                        ? '✓ Estás cerca — podés escanear'
                        : `📏 ${formatearDistancia(distancia)}`
                      }
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        <MapFitter pins={pins} />
      </MapContainer>

      {/* ── Panel lateral: 50 más cercanas ───────────────────────────────── */}
      <div
        ref={panelRef}
        style={{
          position:   'absolute',
          top:         0,
          right:       0,
          width:       '300px',
          maxWidth:    '100%',
          height:      'calc(100vh - 120px)',
          background:  'white',
          boxShadow:   '-4px 0 20px rgba(0,0,0,0.1)',
          overflowY:   'auto',
          zIndex:      1000,
          padding:     '16px',
          display:     'flex',
          flexDirection: 'column',
          gap:         '0',
        }}
      >
        {/* Header del panel */}
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#1a2a3a', fontWeight: 600, marginBottom: '4px' }}>
            Baldosas cercanas
          </h2>
          {userLocation ? (
            <p style={{ fontSize: '0.8rem', color: '#0369a1', margin: 0 }}>
              📍 Las 50 más cercanas a vos
            </p>
          ) : loadingLocation ? (
            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
              Obteniendo tu ubicación…
            </p>
          ) : (
            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
              Primeras 50 baldosas · Activá el GPS para ordenar por distancia
            </p>
          )}
        </div>

        {/* Contador total de pins del mapa */}
        {!loadingPins && (
          <div style={{
            padding:      '6px 10px',
            background:   'rgba(37,99,235,0.06)',
            borderRadius: '8px',
            marginBottom: '12px',
            fontSize:     '0.8rem',
            color:        '#2563eb',
          }}>
            🏛️ {pins.length.toLocaleString('es-AR')} baldosas en el mapa
          </div>
        )}

        {/* Lista */}
        {loadingCercanas || (loadingLocation && cercanas.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div className="loading" />
            <p style={{ marginTop: '10px', color: '#4a6b7c', fontSize: '0.85rem' }}>
              Cargando cercanas…
            </p>
          </div>
        ) : cercanas.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
            No se encontraron baldosas cercanas
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cercanas.map(b => {
              const cerca = b.distancia !== undefined && b.distancia <= RADIO_MAXIMO
              const seleccionada = selectedId === b.id
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedId(seleccionada ? null : b.id)}
                  style={{
                    padding:    '12px',
                    border:     seleccionada ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor:     'pointer',
                    background: seleccionada ? 'rgba(37,99,235,0.05)' : 'white',
                    transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a2a3a', marginBottom: '2px' }}>
                    {b.nombre}
                  </p>
                  {b.direccion && (
                    <p style={{ fontSize: '0.8rem', color: '#4a6b7c', marginBottom: '4px' }}>
                      {b.direccion}{b.barrio ? ` · ${b.barrio}` : ''}
                    </p>
                  )}
                  {b.distancia !== undefined && (
                    <span style={{
                      display:      'inline-block',
                      fontSize:     '0.75rem',
                      fontWeight:   600,
                      padding:      '2px 8px',
                      borderRadius: '12px',
                      background:   cerca ? '#dcfce7' : '#f3f4f6',
                      color:        cerca ? '#166534' : '#6b7280',
                    }}>
                      {cerca ? '✓ Cerca' : formatearDistancia(b.distancia)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
