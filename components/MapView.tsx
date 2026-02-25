'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
  iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -40],
})

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="white" stroke-width="3"/>
    </svg>
  `),
  iconSize: [24, 24], iconAnchor: [12, 12],
})

const RADIO_MAXIMO   = 100
const LIMIT_CERCANAS = 20

interface Pin {
  id: string; codigo: string; nombre: string
  direccion: string; barrio: string; lat: number; lng: number
}

interface BaldosaCercana {
  id: string; codigo: string; nombre: string
  lat: number; lng: number; direccion: string; barrio: string
  mensajeAR: string; distancia?: number
}

interface MapViewProps {
  initialLocation: { lat: number; lng: number }
}

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3
  const ph1 = (lat1 * Math.PI) / 180, ph2 = (lat2 * Math.PI) / 180
  const dp = ((lat2 - lat1) * Math.PI) / 180
  const dl = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dp/2)**2 + Math.cos(ph1)*Math.cos(ph2)*Math.sin(dl/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function formatearDistancia(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`
}

function MapFitter({ pins }: { pins: Pin[] }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (pins.length > 0 && !done.current) {
      done.current = true
      map.fitBounds(
        L.latLngBounds(pins.map(p => [p.lat, p.lng] as [number, number])),
        { padding: [50, 50], maxZoom: 15 }
      )
    }
  }, [pins, map])
  return null
}

export default function MapView({ initialLocation }: MapViewProps) {
  const [pins,            setPins]            = useState<Pin[]>([])
  const [loadingPins,     setLoadingPins]     = useState(true)
  const [userLocation,    setUserLocation]    = useState<{lat:number;lng:number}|null>(null)
  const [loadingLocation, setLoadingLocation] = useState(true)
  const [panelAbierto,    setPanelAbierto]    = useState(false)
  const [cercanas,        setCercanas]        = useState<BaldosaCercana[]>([])
  const [loadingCercanas, setLoadingCercanas] = useState(false)
  const [cargado,         setCargado]         = useState(false)
  const [selectedId,      setSelectedId]      = useState<string|null>(null)

  useEffect(() => {
    if (!navigator.geolocation) { setLoadingLocation(false); return }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoadingLocation(false) },
      ()  => setLoadingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    fetch('/api/baldosas/pins')
      .then(r => r.json())
      .then(d => setPins(d.pins || []))
      .catch(e => console.error('Error pins:', e))
      .finally(() => setLoadingPins(false))
  }, [])

  const abrirPanel = () => {
    setPanelAbierto(true)
    if (cargado) return
    setLoadingCercanas(true)
    setCargado(true)
    if (userLocation) {
      const { lat, lng } = userLocation
      fetch(`/api/baldosas/nearby?lat=${lat}&lng=${lng}&radius=5000`)
        .then(r => r.json())
        .then(d => {
          const lista: BaldosaCercana[] = (d.baldosas || [])
            .slice(0, LIMIT_CERCANAS)
            .map((b: any) => ({ ...b, distancia: calcularDistancia(lat, lng, b.lat, b.lng) }))
          lista.sort((a, b) => (a.distancia??0) - (b.distancia??0))
          setCercanas(lista)
        })
        .catch(e => console.error('Error cercanas:', e))
        .finally(() => setLoadingCercanas(false))
    } else {
      setCercanas(pins.slice(0, LIMIT_CERCANAS).map(p => ({ ...p, mensajeAR: '' })))
      setLoadingCercanas(false)
    }
  }

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 120px)' }}>

      <MapContainer
        center={[userLocation?.lat ?? initialLocation.lat, userLocation?.lng ?? initialLocation.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup><div style={{ fontFamily: 'sans-serif', textAlign: 'center' }}><strong>Tu ubicación</strong></div></Popup>
          </Marker>
        )}
        {pins.map(pin => {
          const distancia = userLocation ? calcularDistancia(userLocation.lat, userLocation.lng, pin.lat, pin.lng) : null
          const cerca = distancia !== null && distancia <= RADIO_MAXIMO
          return (
            <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={baldosaIcon}
              eventHandlers={{ click: () => setSelectedId(pin.id) }}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', minWidth: '190px' }}>
                  <h3 style={{ fontSize: '1rem', color: '#1a2a3a', marginBottom: '4px' }}>{pin.nombre}</h3>
                  {pin.direccion && <p style={{ fontSize: '0.82rem', color: '#4a6b7c', marginBottom: '8px' }}>🌎 {pin.direccion}</p>}
                  {distancia !== null && (
                    <div style={{ padding: '7px', borderRadius: '6px', textAlign: 'center', fontSize: '0.82rem', background: cerca ? '#dcfce7' : '#f3f4f6', color: cerca ? '#166534' : '#4b5563' }}>
                      {cerca ? '✓ Estás cerca — podés escanear' : `📏 ${formatearDistancia(distancia)}`}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
        <MapFitter pins={pins} />
      </MapContainer>

      {/* Botón abrir panel */}
      {!panelAbierto && (
        <button onClick={abrirPanel} style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: '#1a2a3a', color: 'white', border: 'none',
          borderRadius: '24px', padding: '0.65rem 1.5rem', fontSize: '0.9rem',
          fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
        }}>
          🏛️ Ver baldosas cercanas
          {!loadingPins && (
            <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '1px 8px', fontSize: '0.78rem' }}>
              {pins.length.toLocaleString('es-AR')} en el mapa
            </span>
          )}
        </button>
      )}

      {/* Panel inferior */}
      {panelAbierto && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: 'white', borderRadius: '16px 16px 0 0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
          maxHeight: 'min(25vh, 320px)',
          overflowY: 'auto',
        }}>
          {/* Header sticky */}
          <div style={{
            position: 'sticky', top: 0, background: 'white', borderRadius: '16px 16px 0 0',
            padding: '10px 16px 8px', borderBottom: '1px solid #f0f0f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1,
          }}>
            <div>
              <div style={{ width: '36px', height: '4px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto 6px' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a2a3a' }}>
                {userLocation ? `${LIMIT_CERCANAS} baldosas más cercanas` : `Primeras ${LIMIT_CERCANAS} baldosas`}
              </span>
              {!userLocation && !loadingLocation && (
                <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '1px 0 0' }}>
                  Activá el GPS para ordenar por distancia
                </p>
              )}
            </div>
            <button onClick={() => setPanelAbierto(false)} style={{
              background: '#f3f4f6', border: 'none', borderRadius: '50%',
              width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.85rem',
              color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>✕</button>
          </div>

          {/* Lista */}
          <div style={{ padding: '8px 12px 12px' }}>
            {loadingCercanas ? (
              <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <div className="loading" style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '0.85rem', color: '#4a6b7c' }}>Buscando cercanas…</span>
              </div>
            ) : cercanas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', padding: '12px 0' }}>
                No se encontraron baldosas en el área
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cercanas.map(b => {
                  const cerca = b.distancia !== undefined && b.distancia <= RADIO_MAXIMO
                  const sel   = selectedId === b.id
                  return (
                    <div key={b.id} onClick={() => setSelectedId(sel ? null : b.id)} style={{
                      padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                      border: sel ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      background: sel ? 'rgba(37,99,235,0.05)' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a2a3a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.nombre}
                        </p>
                        {b.direccion && (
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.direccion}{b.barrio ? ` · ${b.barrio}` : ''}
                          </p>
                        )}
                      </div>
                      {b.distancia !== undefined && (
                        <span style={{
                          flexShrink: 0, fontSize: '0.75rem', fontWeight: 600,
                          padding: '3px 8px', borderRadius: '12px',
                          background: cerca ? '#dcfce7' : '#f3f4f6',
                          color:      cerca ? '#166534' : '#6b7280',
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
      )}
    </div>
  )
}
