'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// MapView se importa dinámico igual que en /mapa para evitar SSR de Leaflet
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

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

const BANNER_HEIGHT = 58 // px — banner superior (sin contar safe-area-inset-top)

// Defaults razonables si la URL no trae filtros
const DEFAULT_RADIO = 500
const CATEGORIAS_TODAS = ['artista','politico','historico','deportista','cultural','otro']

export default function RecorridoEscuelaPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [recorrido, setRecorrido] = useState<DatosRecorrido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lectura de filtros desde URL (con defaults razonables)
  const radioParam = Number(searchParams.get('radio'))
  const filtroRadio = Number.isFinite(radioParam) && radioParam > 0 ? radioParam : DEFAULT_RADIO

  const catsParam = searchParams.get('cats')
  const filtroCategorias = catsParam
    ? catsParam.split(',').map(s => s.trim()).filter(Boolean)
    : CATEGORIAS_TODAS

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

  // Estados de carga / error → pantalla completa simple (sin navbar)
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
          <a href="/recorridos/escuela" style={{ color: 'var(--color-stone, #4a6b7c)', fontSize: '0.9rem' }}>
            ← Volver al listado
          </a>
        </div>
      </div>
    )
  }

  const initialLocation = { lat: recorrido.lat, lng: recorrido.lng }

  return (
    // Wrapper fullscreen — antes vivía en layout.tsx, ahora va dentro del page
    // para que solo aplique al mapa
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#f0f4f8' }}>

      {/* Banner superior — info de la escuela + botón "Cambiar filtros" */}
      <a
        href="/recorridos/escuela"
        aria-label="Volver al listado y cambiar filtros"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          height: `calc(${BANNER_HEIGHT}px + env(safe-area-inset-top, 0px))`,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: 'rgba(26, 42, 58, 0.94)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#fff',
          textDecoration: 'none',
          boxShadow: '0 2px 14px rgba(0,0,0,0.3)',
          display: 'flex',
        }}
      >
        <div style={{
          flex: 1,
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          minWidth: 0,
        }}>
          {/* Info de la escuela */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '0.7rem',
              opacity: 0.65,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1.1,
              marginBottom: '2px',
            }}>
              {filtroRadio} m · {filtroCategorias.length} categoría{filtroCategorias.length !== 1 ? 's' : ''}
            </div>
            <div style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}>
              {recorrido.nombre}
            </div>
          </div>

          {/* Botón "Cambiar filtros" */}
          <div
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
              <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none"/>
              <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/>
              <circle cx="7" cy="18" r="2" fill="currentColor" stroke="none"/>
            </svg>
            Cambiar filtros
          </div>
        </div>
      </a>

      {/* Mapa — debajo del banner, ocupa el resto de la pantalla */}
      <div style={{
        position: 'absolute',
        top: `calc(${BANNER_HEIGHT}px + env(safe-area-inset-top, 0px))`,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}>
        <MapView
          initialLocation={initialLocation}
          recorrido={recorrido}
          filtroRadio={filtroRadio}
          filtroCategorias={filtroCategorias}
        />
      </div>
    </div>
  )
}
