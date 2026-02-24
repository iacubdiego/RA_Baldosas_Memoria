'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Baldosa {
  id: string
  codigo: string
  nombre: string
  categoria: string
  descripcion?: string
  mensajeAR: string
  infoExtendida?: string
  imagenUrl?: string
  fotoUrl?: string
  audioUrl?: string
  lat: number
  lng: number
  direccion?: string
  barrio?: string
}

type FaseExperiencia =
  | 'iniciando'       // Pedido de permisos
  | 'caminando'       // Watcheando GPS, sin baldosa cerca
  | 'cerca'           // Baldosa detectada a ≤ RADIO_AVISO metros → notificación
  | 'ar'              // Usuario eligió ver la escena AR
  | 'ficha'           // Detalle completo después de la escena
  | 'error'

// ─── Constantes ───────────────────────────────────────────────────────────────

const RADIO_ACTIVACION_M = 1000   // Metros para mostrar notificación
const RADIO_AVISO_M       = 1200   // Metros para mostrar "te estás acercando"
const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 2000,
  timeout: 10000,
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatearDistancia(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LocationARScanner() {
  const [fase, setFase] = useState<FaseExperiencia>('iniciando')
  const [baldosas, setBaldosas] = useState<Baldosa[]>([])
  const [baldosaCercana, setBaldosaCercana] = useState<Baldosa | null>(null)
  const [baldosaActiva, setBaldosaActiva] = useState<Baldosa | null>(null)
  const [distancia, setDistancia] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [arListo, setArListo] = useState(false)
  const [scriptsOk, setScriptsOk] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  const watchIdRef   = useRef<number | null>(null)
  const sceneRef     = useRef<HTMLElement | null>(null)
  const baldosasRef  = useRef<Baldosa[]>([])   // ref sincronizado para el callback del watcher

  // Mantener ref sincronizada
  useEffect(() => { baldosasRef.current = baldosas }, [baldosas])

  // ── 1. Cargar todas las baldosas al montar ─────────────────────────────────
  useEffect(() => {
    async function fetchBaldosas() {
      try {
        const res  = await fetch('/api/baldosas')
        const data = await res.json()
        setBaldosas(data.baldosas || [])
      } catch {
        setErrorMsg('No se pudieron cargar las baldosas')
        setFase('error')
      }
    }
    fetchBaldosas()
  }, [])

  // ── 2. Pedir permisos y arrancar watcher GPS ───────────────────────────────
  const iniciarGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      setErrorMsg('Tu navegador no soporta geolocalización')
      setFase('error')
      return
    }

    try {
      // Primer fix para validar permiso
      await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, WATCH_OPTIONS)
      )
    } catch (err: any) {
      setErrorMsg(
        err.code === 1
          ? 'Permiso de ubicación denegado. Habilitalo en la configuración del navegador.'
          : 'No se pudo obtener tu ubicación. Intentá afuera o en una zona con mejor señal GPS.'
      )
      setFase('error')
      return
    }

    setFase('caminando')

    // Watcher continuo
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: userLat, longitude: userLng } = pos.coords
        const lista = baldosasRef.current

        // Buscar baldosa más cercana
        let minDist = Infinity
        let masProxima: Baldosa | null = null

        for (const b of lista) {
          const d = calcularDistancia(userLat, userLng, b.lat, b.lng)
          if (d < minDist) {
            minDist = d
            masProxima = b
          }
        }

        setDistancia(minDist < Infinity ? Math.round(minDist) : null)

        if (masProxima && minDist <= RADIO_ACTIVACION_M) {
          // Solo cambiar de fase si no estamos ya en AR o ficha
          setBaldosaCercana(masProxima)
          setFase(prev =>
            prev === 'ar' || prev === 'ficha' ? prev : 'cerca'
          )
        } else {
          // Solo volver a "caminando" si no estamos en escena activa
          setFase(prev =>
            prev === 'ar' || prev === 'ficha' ? prev : 'caminando'
          )
          if (minDist > RADIO_ACTIVACION_M * 2) {
            setBaldosaCercana(null)
          }
        }
      },
      (err) => {
        console.warn('GPS error:', err.message)
      },
      WATCH_OPTIONS
    )
  }, [])

  // Limpiar watcher al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // ── 3. Cargar scripts AR.js cuando el usuario elige ver la escena ──────────
  useEffect(() => {
    if (fase !== 'ar' || scriptsOk) return

    async function cargarScripts() {
      // A-Frame
      if (!(window as any).AFRAME) {
        await loadScript('https://aframe.io/releases/1.4.1/aframe.min.js')
        await delay(300)
      }
      // AR.js con componente GPS
      if (!(window as any).AFRAME?.components?.['gps-camera']) {
        await loadScript(
          'https://cdn.jsdelivr.net/npm/ar.js@2.3.4/aframe/build/aframe-ar.js'
        )
        await delay(300)
      }
      setScriptsOk(true)
    }

    cargarScripts().catch(() => {
      setErrorMsg('No se pudieron cargar las librerías AR')
      setFase('error')
    })
  }, [fase, scriptsOk])

  // ── 4. Montar escena A-Frame con AR.js cuando los scripts estén listos ─────
  useEffect(() => {
    if (!scriptsOk || fase !== 'ar' || !baldosaActiva) return

    const contenedor = document.getElementById('ar-container')
    if (!contenedor) return

    // Limpiar escena anterior si existía
    contenedor.innerHTML = ''
    setArListo(false)

    const { lat, lng, fotoUrl, nombre, mensajeAR } = baldosaActiva

    contenedor.innerHTML = `
      <a-scene
        id="escena-ar"
        embedded
        arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false; trackingMethod: best;"
        vr-mode-ui="enabled: false"
        renderer="logarithmicDepthBuffer: true; antialias: true;"
        loading-screen="dotsColor: white; backgroundColor: #1a2a3a"
      >
        <a-assets>
          ${fotoUrl ? `<img id="foto-victima" src="${fotoUrl}" crossorigin="anonymous" />` : ''}
        </a-assets>

        <!-- Cámara GPS -->
        <a-camera gps-camera rotation-reader></a-camera>

        <!-- Entidad anclada a coordenadas reales de la baldosa -->
        <a-entity
          id="baldosa-ar-entity"
          gps-entity-place="latitude: ${lat}; longitude: ${lng}"
        >
          <!-- Marco / portaretrato flotante -->
          <a-box
            position="0 1.6 0"
            width="0.85"
            height="1.1"
            depth="0.05"
            color="#1a2a3a"
            opacity="0.92"
          ></a-box>

          <!-- Foto dentro del marco -->
          ${fotoUrl ? `
          <a-image
            id="foto-ar"
            src="#foto-victima"
            position="0 1.6 0.03"
            width="0.75"
            height="0.95"
            material="shader: flat; side: double;"
          ></a-image>
          ` : `
          <a-text
            value="${nombre}"
            position="0 1.6 0.04"
            align="center"
            width="1.4"
            color="#f0e6d3"
          ></a-text>
          `}

          <!-- Nombre de la víctima -->
          <a-text
            value="${nombre.toUpperCase()}"
            position="0 0.9 0"
            align="center"
            width="1.6"
            color="#f0e6d3"
            font="exo2bold"
            wrap-count="20"
          ></a-text>

          <!-- Mensaje AR -->
          <a-text
            value="${mensajeAR}"
            position="0 0.65 0"
            align="center"
            width="1.4"
            color="#90b4ce"
            wrap-count="28"
          ></a-text>

          <!-- Pañuelo blanco pequeño arriba -->
          <a-plane
            position="0 2.35 0"
            width="0.3"
            height="0.25"
            color="white"
            opacity="0.9"
            rotation="-10 0 0"
          ></a-plane>

          <!-- Animación suave de flotación vertical -->
          <a-animation
            attribute="position"
            from="0 0 0"
            to="0 0.12 0"
            direction="alternate"
            dur="2800"
            easing="easeInOutSine"
            repeat="indefinite"
          ></a-animation>
        </a-entity>
      </a-scene>
    `

    const scene = document.getElementById('escena-ar') as any
    sceneRef.current = scene

    const onLoaded = () => setArListo(true)
    scene.addEventListener('loaded', onLoaded)

    return () => {
      scene.removeEventListener('loaded', onLoaded)
      contenedor.innerHTML = ''
      setArListo(false)
    }
  }, [scriptsOk, fase, baldosaActiva])

  // ── 5. Handlers de acciones del usuario ───────────────────────────────────

  const verEscenaAR = useCallback(() => {
    if (!baldosaCercana) return
    setBaldosaActiva(baldosaCercana)
    setGuardado(false)
    setFase('ar')
  }, [baldosaCercana])

  const cerrarAR = useCallback(() => {
    setBaldosaActiva(prev => prev)  // mantener referencia para ficha
    setFase('ficha')
  }, [])

  const volverACaminar = useCallback(() => {
    setBaldosaActiva(null)
    setScriptsOk(false)
    setArListo(false)
    setFase('caminando')
  }, [])

  const guardarEnRecorrido = useCallback(async () => {
    if (!baldosaActiva || guardando) return
    setGuardando(true)

    try {
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        window.location.href = `/login?redirect=/scanner`
        return
      }

      const res = await fetch('/api/recorridos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baldosaId:         baldosaActiva.codigo || baldosaActiva.id,
          nombreVictima:     baldosaActiva.nombre,
          fechaDesaparicion: '',
          fotoBase64:        baldosaActiva.imagenUrl || '',
          ubicacion:         baldosaActiva.direccion || baldosaActiva.barrio || 'Buenos Aires',
          lat:               baldosaActiva.lat,
          lng:               baldosaActiva.lng,
          notas:             '',
        }),
      })

      const data = await res.json()
      if (res.ok || data.error?.includes('Ya has escaneado')) {
        setGuardado(true)
      }
    } catch {
      // Silencioso — no es crítico
    } finally {
      setGuardando(false)
    }
  }, [baldosaActiva, guardando])

  // ── 6. Renders por fase ───────────────────────────────────────────────────

  // Pantalla de inicio / pedido de permisos
  if (fase === 'iniciando') {
    return (
      <div style={estilos.pantallaCentrada}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📍</div>
        <h1 style={estilos.titulo}>Baldosas por la Memoria</h1>
        <p style={estilos.subtitulo}>
          Caminá por Buenos Aires y descubrí las baldosas que honran a los desaparecidos.
          Cuando te acerques a una, verás su historia.
        </p>
        <button
          onClick={iniciarGPS}
          style={estilos.btnPrimario}
        >
          📍 Activar ubicación
        </button>
        <a href="/mapa" style={estilos.btnSecundario}>
          🗺️ Ver mapa primero
        </a>
      </div>
    )
  }

  // Error
  if (fase === 'error') {
    return (
      <div style={estilos.pantallaCentrada}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ ...estilos.titulo, fontSize: '1.4rem' }}>Algo salió mal</h2>
        <p style={{ ...estilos.subtitulo, color: '#fca5a5' }}>{errorMsg}</p>
        <button onClick={() => { setFase('iniciando'); setErrorMsg('') }} style={estilos.btnPrimario}>
          Reintentar
        </button>
        <a href="/" style={estilos.btnSecundario}>Volver al inicio</a>
      </div>
    )
  }

  // Caminando — buscando baldosas
  if (fase === 'caminando') {
    const proxima = baldosas.reduce<{ b: Baldosa | null; d: number }>(
      (acc, b) => {
        // No tenemos la posición del user acá, pero distancia en ref sí
        return acc
      },
      { b: null, d: Infinity }
    )
    return (
      <div style={estilos.pantallaOscura}>
        {/* Navbar compacta */}
        <div style={estilos.navBar}>
          <a href="/" style={estilos.navLink}>← Inicio</a>
          <a href="/mapa" style={estilos.navLink}>🗺️ Mapa</a>
        </div>

        <div style={estilos.centradoVertical}>
          {/* Radar animado */}
          <div style={estilos.radar}>
            <div style={estilos.radarPulso1} />
            <div style={estilos.radarPulso2} />
            <span style={{ fontSize: '2.5rem', position: 'relative', zIndex: 2 }}>📍</span>
          </div>

          <h2 style={{ ...estilos.titulo, marginTop: '1.5rem' }}>Buscando baldosas</h2>
          <p style={estilos.subtitulo}>
            Caminá por el barrio. Te avisaremos cuando estés cerca de una baldosa de la memoria.
          </p>

          {distancia !== null && (
            <div style={estilos.chipDistancia}>
              Baldosa más cercana: <strong> {formatearDistancia(distancia)}</strong>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', opacity: 0.6, fontSize: '0.85rem', color: '#90b4ce' }}>
            {baldosas.length} baldosas cargadas · radio de detección {RADIO_ACTIVACION_M}m
          </div>
        </div>
      </div>
    )
  }

  // Cerca — notificación de baldosa detectada
  if (fase === 'cerca' && baldosaCercana) {
    return (
      <div style={estilos.pantallaOscura}>
        <div style={estilos.navBar}>
          <a href="/" style={estilos.navLink}>← Inicio</a>
          <a href="/mapa" style={estilos.navLink}>🗺️ Mapa</a>
        </div>

        {/* Tarjeta de notificación */}
        <div style={estilos.cardNotificacion}>
          {/* Banner superior */}
          <div style={estilos.bannerDeteccion}>
            <span style={{ fontSize: '1.4rem' }}>📍</span>
            <span>Baldosa detectada</span>
            {distancia !== null && (
              <span style={estilos.badgeDistancia}>{formatearDistancia(distancia)}</span>
            )}
          </div>

          {/* Contenido */}
          <div style={{ padding: '1.5rem' }}>
            {/* Foto si existe */}
            {baldosaCercana.fotoUrl && (
              <div style={estilos.contenedorFoto}>
                <img
                  src={baldosaCercana.fotoUrl}
                  alt={baldosaCercana.nombre}
                  style={estilos.fotoThumbnail}
                />
              </div>
            )}

            <div style={estilos.chipCategoria}>
              {baldosaCercana.categoria.toUpperCase()}
            </div>

            <h2 style={estilos.nombreBaldosa}>{baldosaCercana.nombre}</h2>

            {baldosaCercana.direccion && (
              <p style={estilos.direccion}>📍 {baldosaCercana.direccion}</p>
            )}

            {baldosaCercana.descripcion && (
              <p style={estilos.descripcionCorta}>
                {baldosaCercana.descripcion.slice(0, 120)}
                {baldosaCercana.descripcion.length > 120 ? '…' : ''}
              </p>
            )}

            <p style={{ ...estilos.subtitulo, fontSize: '0.9rem', marginTop: '1rem' }}>
              {baldosaCercana.mensajeAR}
            </p>

            {/* Acciones */}
            <div style={estilos.botonesAccion}>
              <button onClick={verEscenaAR} style={estilos.btnPrimario}>
                ✨ Ver en AR
              </button>
              <button
                onClick={volverACaminar}
                style={estilos.btnSecundario}
              >
                Seguir caminando
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Escena AR activa
  if (fase === 'ar') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
        {/* Contenedor donde se monta A-Frame */}
        <div id="ar-container" style={{ width: '100%', height: '100%' }} />

        {/* Overlay de carga */}
        {!arListo && (
          <div style={estilos.overlayLoading}>
            <div style={estilos.spinner} />
            <p style={{ color: '#f0e6d3', marginTop: '1rem' }}>
              {scriptsOk ? 'Iniciando cámara AR…' : 'Cargando librerías AR…'}
            </p>
          </div>
        )}

        {/* Barra superior */}
        {arListo && (
          <div style={estilos.barraAR}>
            <button onClick={cerrarAR} style={estilos.btnCerrarAR}>
              ✕ Cerrar AR
            </button>
            <span style={estilos.nombreEnAR}>
              {baldosaActiva?.nombre}
            </span>
          </div>
        )}

        {/* Instrucción inicial */}
        {arListo && (
          <div style={estilos.instruccionAR}>
            Apuntá la cámara hacia donde está la baldosa
          </div>
        )}
      </div>
    )
  }

  // Ficha completa post-AR
  if (fase === 'ficha' && baldosaActiva) {
    return (
      <div style={{ ...estilos.pantallaOscura, overflowY: 'auto' }}>
        <div style={estilos.navBar}>
          <button onClick={volverACaminar} style={{ ...estilos.navLink, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Seguir caminando
          </button>
          <a href="/mapa" style={estilos.navLink}>🗺️ Mapa</a>
        </div>

        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '1rem' }}>
          {/* Header con foto */}
          {baldosaActiva.fotoUrl && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img
                src={baldosaActiva.fotoUrl}
                alt={baldosaActiva.nombre}
                style={{
                  width: '160px',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '3px solid #2563eb',
                }}
              />
            </div>
          )}

          <div style={estilos.chipCategoria}>{baldosaActiva.categoria.toUpperCase()}</div>
          <h1 style={{ ...estilos.nombreBaldosa, fontSize: '2rem', marginTop: '0.5rem' }}>
            {baldosaActiva.nombre}
          </h1>

          {baldosaActiva.direccion && (
            <p style={estilos.direccion}>📍 {baldosaActiva.direccion}</p>
          )}

          {baldosaActiva.descripcion && (
            <p style={{ color: '#d0c8bc', lineHeight: 1.7, marginTop: '1rem' }}>
              {baldosaActiva.descripcion}
            </p>
          )}

          {baldosaActiva.infoExtendida && (
            <p style={{ color: '#90b4ce', lineHeight: 1.7, marginTop: '0.75rem', fontSize: '0.95rem' }}>
              {baldosaActiva.infoExtendida}
            </p>
          )}

          {/* Acciones */}
          <div style={{ ...estilos.botonesAccion, marginTop: '2rem' }}>
            <button
              onClick={guardarEnRecorrido}
              disabled={guardando || guardado}
              style={{
                ...estilos.btnPrimario,
                opacity: guardado ? 0.7 : 1,
                background: guardado ? '#166534' : undefined,
              }}
            >
              {guardado ? '✓ Guardado en tu recorrido' : guardando ? 'Guardando…' : '📌 Guardar en mi recorrido'}
            </button>

            <button onClick={verEscenaAR} style={estilos.btnSecundario}>
              ✨ Ver AR de nuevo
            </button>

            <a
              href={`/baldosas/${baldosaActiva.codigo}`}
              style={{ ...estilos.btnSecundario, display: 'block', textAlign: 'center' }}
            >
              📖 Más información
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => res()
    s.onerror = () => rej(new Error(`Error cargando ${src}`))
    document.head.appendChild(s)
  })
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos: Record<string, React.CSSProperties> = {
  pantallaCentrada: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'var(--color-stone)',
    color: 'var(--color-parchment)',
    textAlign: 'center',
  },
  pantallaOscura: {
    minHeight: '100vh',
    background: 'var(--color-stone)',
    color: 'var(--color-parchment)',
  },
  centradoVertical: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 56px)',
    padding: '2rem',
    textAlign: 'center',
  },
  titulo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    color: 'var(--color-parchment)',
    marginBottom: '0.75rem',
  },
  subtitulo: {
    color: '#90b4ce',
    lineHeight: 1.6,
    maxWidth: '400px',
    marginBottom: '1.5rem',
  },
  btnPrimario: {
    display: 'block',
    width: '100%',
    maxWidth: '340px',
    padding: '1rem 1.5rem',
    background: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '0.75rem',
    textDecoration: 'none',
    textAlign: 'center',
  },
  btnSecundario: {
    display: 'block',
    width: '100%',
    maxWidth: '340px',
    padding: '0.85rem 1.5rem',
    background: 'transparent',
    color: 'var(--color-parchment)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '0.75rem',
    textDecoration: 'none',
    textAlign: 'center',
  },
  navBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.25rem',
    background: 'rgba(26, 42, 58, 0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(8px)',
  },
  navLink: {
    color: 'var(--color-parchment)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    opacity: 0.85,
  },
  radar: {
    position: 'relative',
    width: '120px',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulso1: {
    position: 'absolute',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '2px solid var(--color-primary)',
    animation: 'pulso 2s ease-out infinite',
    opacity: 0,
  },
  radarPulso2: {
    position: 'absolute',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '2px solid var(--color-primary)',
    animation: 'pulso 2s ease-out infinite 0.7s',
    opacity: 0,
  },
  chipDistancia: {
    padding: '0.5rem 1.25rem',
    background: 'rgba(37, 99, 235, 0.15)',
    border: '1px solid rgba(37, 99, 235, 0.4)',
    borderRadius: '999px',
    color: '#90b4ce',
    fontSize: '0.9rem',
    marginTop: '1rem',
  },
  cardNotificacion: {
    margin: '1.5rem',
    background: 'rgba(26, 42, 58, 0.97)',
    borderRadius: '16px',
    border: '1px solid rgba(37, 99, 235, 0.4)',
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    animation: 'slideUp 0.35s ease-out',
  },
  bannerDeteccion: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.85rem 1.25rem',
    background: 'rgba(37, 99, 235, 0.25)',
    borderBottom: '1px solid rgba(37, 99, 235, 0.3)',
    color: '#90b4ce',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  badgeDistancia: {
    marginLeft: 'auto',
    padding: '0.2rem 0.75rem',
    background: 'rgba(37, 99, 235, 0.3)',
    borderRadius: '999px',
    fontSize: '0.85rem',
    color: '#60a5fa',
  },
  contenedorFoto: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  fotoThumbnail: {
    width: '110px',
    height: '140px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '2px solid rgba(37, 99, 235, 0.5)',
  },
  chipCategoria: {
    display: 'inline-block',
    padding: '0.2rem 0.75rem',
    background: 'rgba(37, 99, 235, 0.15)',
    color: '#60a5fa',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    marginBottom: '0.5rem',
  },
  nombreBaldosa: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    color: 'var(--color-parchment)',
    marginBottom: '0.25rem',
    lineHeight: 1.2,
  },
  direccion: {
    fontSize: '0.85rem',
    color: '#6b8fa6',
    marginBottom: '0.5rem',
  },
  descripcionCorta: {
    color: '#90b4ce',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    marginTop: '0.5rem',
  },
  botonesAccion: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    marginTop: '1.25rem',
    alignItems: 'center',
  },
  overlayLoading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10, 18, 28, 0.92)',
    zIndex: 50,
  },
  spinner: {
    width: '44px',
    height: '44px',
    border: '3px solid rgba(255,255,255,0.15)',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
  barraAR: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    background: 'rgba(10, 18, 28, 0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
  },
  btnCerrarAR: {
    padding: '0.5rem 1rem',
    background: 'rgba(26, 42, 58, 0.9)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  nombreEnAR: {
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: 600,
    opacity: 0.9,
    maxWidth: '60%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  instruccionAR: {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.6rem 1.2rem',
    background: 'rgba(10, 18, 28, 0.8)',
    color: 'white',
    borderRadius: '999px',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    backdropFilter: 'blur(6px)',
    zIndex: 100,
  },
}
