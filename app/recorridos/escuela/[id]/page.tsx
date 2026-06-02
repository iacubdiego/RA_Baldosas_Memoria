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

// Default razonable si la URL no trae filtros
const DEFAULT_RADIO = 500

export default function RecorridoEscuelaPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [recorrido, setRecorrido] = useState<DatosRecorrido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [descargandoPDF, setDescargandoPDF] = useState(false)
  const [errorPDF, setErrorPDF] = useState<string | null>(null)

  // Lectura del filtro de radio desde URL (con default razonable)
  const radioParam = Number(searchParams.get('radio'))
  const filtroRadio = Number.isFinite(radioParam) && radioParam > 0 ? radioParam : DEFAULT_RADIO

  /** Descarga el PDF del recorrido. Maneja loading + errores. */
  const descargarPDF = async () => {
    if (descargandoPDF || !id) return
    setDescargandoPDF(true)
    setErrorPDF(null)
    try {
      const res = await fetch(`/api/escuelas/${id}/pdf?radio=${filtroRadio}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'No se pudo generar el PDF')
      }
      const blob = await res.blob()
      // Filename desde el header Content-Disposition si está
      const cd = res.headers.get('content-disposition') || ''
      const match = cd.match(/filename="([^"]+)"/)
      const nombre = match?.[1] || `recorrido-${id}.pdf`
      // Descarga
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nombre
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setErrorPDF(e.message || 'Error al descargar')
      // Auto-ocultar el error tras unos segundos
      setTimeout(() => setErrorPDF(null), 5000)
    } finally {
      setDescargandoPDF(false)
    }
  }


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

      {/* Banner superior — info de la escuela + botones de acción */}
      <div
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
          gap: '8px',
          minWidth: 0,
        }}>
          {/* Info de la escuela — clickeable, vuelve al listado */}
          <a
            href="/recorridos/escuela"
            aria-label="Volver al listado y cambiar filtros"
            style={{
              minWidth: 0,
              flex: 1,
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            <div style={{
              fontSize: '0.7rem',
              opacity: 0.65,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1.1,
              marginBottom: '2px',
            }}>
              {filtroRadio} m de radio
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
          </a>

          {/* Botón "Descargar PDF" */}
          <button
            type="button"
            onClick={descargarPDF}
            disabled={descargandoPDF}
            aria-label="Descargar el recorrido en PDF"
            title={errorPDF ?? 'Descargar PDF del recorrido'}
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              background: descargandoPDF ? 'rgba(255,255,255,0.08)' : 'rgba(37,99,235,0.4)',
              border: '1px solid ' + (descargandoPDF ? 'rgba(255,255,255,0.15)' : 'rgba(37,99,235,0.65)'),
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#fff',
              whiteSpace: 'nowrap',
              cursor: descargandoPDF ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {descargandoPDF ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '12px', height: '12px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'ra-spin 0.8s linear infinite',
                }} />
                Generando…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                PDF
              </>
            )}
          </button>

          {/* Botón "Cambiar filtros" */}
          <a
            href="/recorridos/escuela"
            aria-label="Volver al listado y cambiar filtros"
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
              textDecoration: 'none',
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
            Filtros
          </a>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes ra-spin { to { transform: rotate(360deg); } }` }} />
      </div>

      {/* Toast de error de PDF (si lo hay) */}
      {errorPDF && (
        <div style={{
          position: 'absolute',
          top: `calc(${BANNER_HEIGHT}px + env(safe-area-inset-top, 0px) + 12px)`,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          background: '#c0392b',
          color: '#fff',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '0.82rem',
          fontWeight: 600,
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        }}>
          {errorPDF}
        </div>
      )}

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
        />
      </div>
    </div>
  )
}
