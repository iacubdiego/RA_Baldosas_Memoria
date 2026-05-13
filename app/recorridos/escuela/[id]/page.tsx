'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// MapView se importa dinámico igual que en /mapa para evitar SSR de Leaflet
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

const INITIAL_LOCATION = { lat: -34.6037, lng: -58.3816 } // Centro CABA

interface DatosRecorrido {
  id: string
  nombre: string
  direccion: string
  barrio: string
  lat: number
  lng: number
  baldosas: {
    id: string
    codigo: string
    nombre: string
    lat: number
    lng: number
    direccion: string
  }[]
  ruta_geojson: GeoJSON.LineString | null
}

export default function RecorridoEscuelaPage() {
  const { id } = useParams<{ id: string }>()
  const [recorrido, setRecorrido] = useState<DatosRecorrido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/escuelas/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Recorrido no encontrado')
        return r.json()
      })
      .then(data => setRecorrido(data.escuela))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-parchment, #f5f0e8)',
        fontFamily: 'sans-serif',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--color-stone, #4a6b7c)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏫</div>
          <p>Cargando recorrido…</p>
        </div>
      </div>
    )
  }

  if (error || !recorrido) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-parchment, #f5f0e8)',
        fontFamily: 'sans-serif',
      }}>
        <div style={{ textAlign: 'center', color: '#c0392b', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <p>{error ?? 'Recorrido no encontrado'}</p>
          <a href="/mapa" style={{ color: 'var(--color-stone, #4a6b7c)', fontSize: '0.9rem' }}>
            ← Volver al mapa
          </a>
        </div>
      </div>
    )
  }

  const initialLocation = { lat: recorrido.lat, lng: recorrido.lng }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

      {/* Banner superior con info de la escuela */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        background: 'var(--color-stone, #1a2a3a)',
        color: '#fff',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recorrido por la Memoria
          </div>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {recorrido.nombre}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
            {recorrido.baldosas.length} baldosa{recorrido.baldosas.length !== 1 ? 's' : ''} en el recorrido
          </div>
        </div>

        <a
          href="/mapa"
          style={{
            flexShrink: 0,
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none',
            padding: '4px 8px',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          ← Mapa
        </a>
      </div>

      {/* Mapa — el mismo componente, con el prop recorrido */}
      <div style={{ position: 'absolute', inset: 0, paddingTop: '64px' }}>
        <MapView
          initialLocation={initialLocation}
          recorrido={recorrido}
        />
      </div>
    </div>
  )
}
