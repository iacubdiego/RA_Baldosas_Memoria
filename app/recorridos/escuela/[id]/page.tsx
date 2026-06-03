'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation'
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
// Rango del slider del panel de filtros — coincide con el del listado
const RADIO_MIN = 100
const RADIO_MAX = 1500
const RADIO_STEP = 50

export default function RecorridoEscuelaPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [recorrido, setRecorrido] = useState<DatosRecorrido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [descargandoPDF, setDescargandoPDF] = useState(false)
  const [errorPDF, setErrorPDF] = useState<string | null>(null)
  // Panel flotante de filtros
  const [mostrarPanelFiltros, setMostrarPanelFiltros] = useState(false)

  // Lectura del filtro de radio desde URL (con default razonable)
  const radioParam = Number(searchParams.get('radio'))
  const filtroRadio = Number.isFinite(radioParam) && radioParam > 0 ? radioParam : DEFAULT_RADIO

  // Estado local del slider dentro del panel (se aplica al cerrar / soltar)
  const [radioLocal, setRadioLocal] = useState(filtroRadio)

  // Si la URL cambia (ej. atrás en el browser), sincronizar el slider local
  useEffect(() => {
    setRadioLocal(filtroRadio)
  }, [filtroRadio])

  /**
   * Aplica el nuevo radio: actualiza la URL con ?radio=X, lo cual hace que
   * filtroRadio cambie y MapView se re-renderice con el nuevo prop.
   * Usa router.replace para no llenar el historial con cada cambio.
   */
  const aplicarRadio = (nuevoRadio: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('radio', String(nuevoRadio))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

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
          {/* Info de la escuela — clickeable, vuelve al listado de escuelas */}
          <a
            href="/recorridos/escuela"
            aria-label="Volver al listado de escuelas"
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

          {/* Botón "Filtros" — abre panel flotante para cambiar el radio sin salir del mapa */}
          <button
            type="button"
            onClick={() => setMostrarPanelFiltros(true)}
            aria-label="Cambiar el radio del filtro"
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
              cursor: 'pointer',
              fontFamily: 'inherit',
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
          </button>
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

      {/* Panel flotante de filtros — slider del radio sin salir del mapa */}
      {mostrarPanelFiltros && (
        <>
          {/* Overlay sutil sobre el mapa para que el panel resalte */}
          <div
            onClick={() => setMostrarPanelFiltros(false)}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(26, 42, 58, 0.25)',
              zIndex: 1002,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />
          {/* Panel propiamente dicho */}
          <div
            style={{
              position: 'absolute',
              top: `calc(${BANNER_HEIGHT}px + env(safe-area-inset-top, 0px) + 14px)`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1003,
              width: 'min(92vw, 380px)',
              background: '#fff',
              borderRadius: '12px',
              padding: '18px 20px 20px',
              boxShadow: '0 6px 26px rgba(0, 0, 0, 0.22)',
            }}
          >
            {/* Header del panel */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}>
              <span style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-stone, #1a2a3a)',
              }}>
                Radio de búsqueda
              </span>
              <button
                type="button"
                onClick={() => setMostrarPanelFiltros(false)}
                aria-label="Cerrar panel de filtros"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'inline-flex',
                  color: 'var(--color-dust, #4a6b7c)',
                  fontFamily: 'inherit',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Valor actual */}
            <div style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--color-primary, #2563eb)',
              textAlign: 'center',
              marginBottom: '6px',
              lineHeight: 1.1,
            }}>
              {radioLocal} m
            </div>
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--color-dust, #4a6b7c)',
              textAlign: 'center',
              marginBottom: '14px',
            }}>
              Distancia desde la escuela
            </div>

            {/* Slider */}
            <input
              type="range"
              min={RADIO_MIN}
              max={RADIO_MAX}
              step={RADIO_STEP}
              value={radioLocal}
              onChange={e => setRadioLocal(Number(e.target.value))}
              onPointerUp={() => {
                if (radioLocal !== filtroRadio) {
                  aplicarRadio(radioLocal)
                  setMostrarPanelFiltros(false)
                }
              }}
              onTouchEnd={() => {
                if (radioLocal !== filtroRadio) {
                  aplicarRadio(radioLocal)
                  setMostrarPanelFiltros(false)
                }
              }}
              onKeyUp={e => {
                // Para accesibilidad: aplicar al soltar tecla
                if (e.key === 'Enter' && radioLocal !== filtroRadio) {
                  aplicarRadio(radioLocal)
                  setMostrarPanelFiltros(false)
                }
              }}
              style={{
                width: '100%',
                accentColor: 'var(--color-primary, #2563eb)',
                cursor: 'pointer',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: 'var(--color-dust, #4a6b7c)',
              marginTop: '6px',
            }}>
              <span>{RADIO_MIN} m</span>
              <span>{RADIO_MAX} m</span>
            </div>

            {/* Botón "Aplicar" (para teclado y como respaldo) */}
            <button
              type="button"
              onClick={() => {
                if (radioLocal !== filtroRadio) aplicarRadio(radioLocal)
                setMostrarPanelFiltros(false)
              }}
              style={{
                marginTop: '18px',
                width: '100%',
                padding: '10px 14px',
                background: 'var(--color-primary, #2563eb)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Aplicar
            </button>
          </div>
        </>
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
