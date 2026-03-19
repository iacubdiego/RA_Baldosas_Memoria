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
  vecesEscaneada?: number
}

type FaseExperiencia =
  | 'verificando'     // Chequeando permisos silenciosamente al montar
  | 'iniciando'       // Pedido de permisos
  | 'caminando'       // Watcheando GPS, sin baldosa cerca
  | 'cerca'           // Baldosa detectada a ≤ RADIO_AVISO metros → notificación
  | 'ar'              // Usuario eligió ver la escena AR
  | 'ficha'           // Detalle completo después de la escena
  | 'error'

// ─── Constantes ───────────────────────────────────────────────────────────────

const RADIO_ACTIVACION_M = 2100   // Metros para mostrar notificación
const RADIO_AVISO_M       = 2500   // Metros para mostrar "te estás acercando"
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
  const [fase, setFase] = useState<FaseExperiencia>('verificando')
  const [baldosas, setBaldosas] = useState<Baldosa[]>([])
  const [baldosaCercana, setBaldosaCercana] = useState<Baldosa | null>(null)
  const [baldosaActiva, setBaldosaActiva] = useState<Baldosa | null>(null)
  const [distancia, setDistancia] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [arListo, setArListo] = useState(false)
  const [scriptsOk, setScriptsOk] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [escaneando, setEscaneando] = useState(false)
  const [fotoOk, setFotoOk] = useState(false)
  const [flash, setFlash] = useState(false)

  // ── Panel de info AR — alterna con el botón ℹ️ ────────────────────────────
  // panelVisible controla si el panel A-Frame está visible en la escena.
  // Al cambiar, se emite el evento 'panel-mostrar' o 'panel-ocultar' hacia
  // el entity #panel-baldosa en A-Frame, que dispara las animaciones de
  // opacidad y escala (efecto materialize).
  const [panelVisible, setPanelVisible] = useState(false)
  const [hudListo, setHudListo] = useState(false)

  // Controles AR — persisten en localStorage
  const [offsetY,  setOffsetY]  = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return parseFloat(localStorage.getItem('ar_offset_y') || '0')
  })
  const [rotY,     setRotY]     = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return parseFloat(localStorage.getItem('ar_rot_y') || '0')
  })
  const [zoom,     setZoom]     = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    return parseFloat(localStorage.getItem('ar_zoom') || '1')
  })

  const watchIdRef      = useRef<number | null>(null)
  const iniciarGPSRef   = useRef<(() => void) | null>(null)
  const sceneRef        = useRef<HTMLElement | null>(null)
  const baldosasRef     = useRef<Baldosa[]>([])

  // Mantener ref sincronizada
  useEffect(() => { baldosasRef.current = baldosas }, [baldosas])

  // Inyectar keyframe shutterFlash una sola vez
  useEffect(() => {
    const id = 'shutter-flash-style'
    if (!document.getElementById(id)) {
      const s = document.createElement('style')
      s.id = id
      s.textContent = `
        @keyframes shutterFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes letraSprayAR {
          0%   { opacity: 0; transform: scale(1.3); filter: blur(5px); }
          45%  { opacity: 1; filter: blur(0.5px); }
          100% { opacity: 1; transform: scale(1);  filter: blur(0px); }
        }
        .letra-hud-ar {
          display: inline-block;
          font-family: 'Oswald', 'Impact', 'Arial Black', sans-serif;
          font-size: clamp(1.5rem, 5vw, 2rem);
          font-weight: 700;
          text-transform: uppercase;
          color: transparent;
          position: relative;
          opacity: 0;
          margin-right: 0.055em;
        }
        .espacio-hud-ar {
          display: inline-block;
          width: 0.45em;
          height: 1px;
        }
        .letra-hud-ar::before {
          content: attr(data-l);
          position: absolute;
          inset: 0;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          text-transform: inherit;
          white-space: pre;
          background:
            conic-gradient(
              from 0deg at 20% 30%,
              rgba(255,255,255,1) 0deg, transparent 2.5deg,
              transparent 7deg, rgba(255,255,255,1) 8deg, transparent 11deg,
              transparent 18deg, rgba(255,255,255,0.97) 19deg, transparent 22deg,
              transparent 32deg, rgba(255,255,255,1) 33deg, transparent 37deg,
              transparent 52deg, rgba(255,255,255,0.98) 53deg, transparent 57deg,
              transparent 72deg, rgba(255,255,255,1) 73deg, transparent 77deg,
              transparent 95deg, rgba(255,255,255,0.97) 96deg, transparent 100deg,
              transparent 120deg, rgba(255,255,255,1) 121deg, transparent 126deg,
              transparent 145deg, rgba(255,255,255,0.98) 146deg, transparent 151deg,
              transparent 175deg, rgba(255,255,255,1) 176deg, transparent 181deg,
              transparent 205deg, rgba(255,255,255,0.97) 206deg, transparent 211deg,
              transparent 235deg, rgba(255,255,255,1) 236deg, transparent 241deg,
              transparent 265deg, rgba(255,255,255,0.98) 266deg, transparent 271deg,
              transparent 305deg, rgba(255,255,255,1) 306deg, transparent 311deg,
              transparent 338deg, rgba(255,255,255,0.97) 339deg, transparent 344deg
            ),
            conic-gradient(
              from 90deg at 70% 60%,
              rgba(255,255,255,0.98) 0deg, transparent 3.5deg,
              transparent 13deg, rgba(255,255,255,1) 14deg, transparent 19deg,
              transparent 35deg, rgba(255,255,255,0.97) 36deg, transparent 41deg,
              transparent 62deg, rgba(255,255,255,1) 63deg, transparent 68deg,
              transparent 92deg, rgba(255,255,255,0.98) 93deg, transparent 98deg,
              transparent 128deg, rgba(255,255,255,1) 129deg, transparent 134deg,
              transparent 162deg, rgba(255,255,255,0.97) 163deg, transparent 168deg,
              transparent 198deg, rgba(255,255,255,1) 199deg, transparent 204deg,
              transparent 232deg, rgba(255,255,255,0.98) 233deg, transparent 238deg,
              transparent 292deg, rgba(255,255,255,1) 293deg, transparent 298deg,
              transparent 322deg, rgba(255,255,255,0.97) 323deg, transparent 328deg
            );
          background-size: 7px 7px, 10px 10px;
          filter: blur(0.6px) contrast(220%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .letra-hud-ar::after {
          content: attr(data-l);
          position: absolute;
          inset: 0;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          white-space: pre;
          filter: blur(6px);
          z-index: -1;
          -webkit-text-fill-color: rgba(255,255,255,0.55);
        }
        .letra-hud-ar.pintada {
          animation: letraSprayAR 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .consigna-hud-ar span {
          display: inline-block;
          white-space: pre;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
      `
      document.head.appendChild(s)
    }
  }, [])

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

  // ── 2. Verificar permisos al montar — si ya están otorgados, arrancar directo
  useEffect(() => {
    if (!navigator.geolocation) {
      setFase('iniciando')
      return
    }
    const fallback = setTimeout(() => setFase('iniciando'), 1500)

    navigator.geolocation.getCurrentPosition(
      () => {
        clearTimeout(fallback)
        iniciarGPSRef.current?.()
      },
      () => {
        clearTimeout(fallback)
        setFase('iniciando')
      },
      { enableHighAccuracy: false, timeout: 1000, maximumAge: 60000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 3. Pedir permisos y arrancar watcher GPS ───────────────────────────────
  const iniciarGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      setErrorMsg('Tu navegador no soporta geolocalización')
      setFase('error')
      return
    }

    try {
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

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: userLat, longitude: userLng } = pos.coords
        const lista = baldosasRef.current

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
          setBaldosaCercana(prev => {
            const mismaId = prev && (prev.codigo || prev.id) === (masProxima.codigo || masProxima.id)
            return mismaId
              ? { ...masProxima, vecesEscaneada: prev!.vecesEscaneada }
              : masProxima
          })
          setFase(prev =>
            prev === 'ar' || prev === 'ficha' ? prev : 'cerca'
          )
        } else {
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

  iniciarGPSRef.current = iniciarGPS

  // Fetch vecesEscaneada cuando cambia la baldosa cercana
  useEffect(() => {
    if (!baldosaCercana) return
    const id = baldosaCercana.codigo || baldosaCercana.id
    fetch(`/api/baldosas/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.baldosa?.vecesEscaneada !== undefined) {
          setBaldosaCercana(b => b ? { ...b, vecesEscaneada: data.baldosa.vecesEscaneada } : b)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baldosaCercana?.codigo, baldosaCercana?.id])

  // Limpiar watcher al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // ── 4. Cargar A-Frame cuando el usuario elige ver la escena ──────────────────
  useEffect(() => {
    if (fase !== 'ar' || scriptsOk) return

    async function cargarScripts() {
      if (!(window as any).AFRAME) {
        await loadScript('https://aframe.io/releases/1.4.1/aframe.min.js')
        await delay(600)
      }
      setScriptsOk(true)
    }

    cargarScripts().catch((e) => {
      console.error('Error cargando scripts AR:', e)
      setErrorMsg('No se pudieron cargar las librerías. Verificá tu conexión a internet.')
      setFase('error')
    })
  }, [fase, scriptsOk])

  // ── 5. Montar escena A-Frame ────────────────────────────────────────────────
  // Composición:
  //   z-index 0 → <video> cámara trasera, fondo real
  //   z-index 1 → canvas A-Frame con alpha:true (transparente)
  // Gestos touch sobre el canvas:
  //   1 dedo arrastra horizontal → rota grupo en Y
  //   2 dedos pinch              → zoom (cambia Z)
  //   2 dedos swipe vertical     → altura (cambia Y)

  useEffect(() => {
    if (!scriptsOk || fase !== 'ar' || !baldosaActiva) return

    const montar = async () => {
      const contenedor = document.getElementById('ar-container')
      if (!contenedor) return

      contenedor.innerHTML = ''
      setArListo(false)
      setPanelVisible(false)
      setHudListo(false)

      // Precargar video
      await new Promise<void>(resolve => {
        const preload = document.createElement('video')
        preload.oncanplay = () => resolve()
        preload.onerror   = () => resolve()
        preload.src = '/videos/panuelo.webm'
        setTimeout(resolve, 3000)
      })

      const { nombre, mensajeAR, descripcion, direccion, fotoUrl } = baldosaActiva

      const nombreSafe  = nombre.replace(/"/g, '&quot;')
      const mensajeSafe = mensajeAR.replace(/"/g, '&quot;')

      // ── Video cámara real como fondo ──────────────────────────────────────────
      const video = document.createElement('video')
      video.id = 'camara-bg'
      video.setAttribute('autoplay', '')
      video.setAttribute('muted', '')
      video.setAttribute('playsinline', '')
      Object.assign(video.style, {
        position: 'absolute', inset: '0',
        width: '100%', height: '100%',
        objectFit: 'cover', zIndex: '0',
      })
      contenedor.appendChild(video)

      let streamActivo: MediaStream | null = null
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      }).then(stream => {
        streamActivo = stream
        video.srcObject = stream
        return video.play()
      }).catch(e => console.warn('Cámara no disponible:', e))

      // ── Canvas A-Frame encima, transparente ───────────────────────────────────
      const wrapper = document.createElement('div')
      Object.assign(wrapper.style, {
        position: 'absolute', inset: '0',
        width: '100%', height: '100%',
        zIndex: '1',
      })
      contenedor.appendChild(wrapper)

      const Z_BASE  = -12
      const Y_OJOS  = 1.6

      // Asset foto — reservado para uso futuro
      const assetFoto = fotoUrl
        ? `<img id="foto-baldosa" src="${fotoUrl}" crossorigin="anonymous">`
        : ''

      wrapper.innerHTML = [
        '<a-scene',
        '  id="escena-ar"',
        '  embedded',
        '  renderer="antialias: true; alpha: true; colorManagement: true; preserveDrawingBuffer: true;"',
        '  background="transparent: true"',
        '  vr-mode-ui="enabled: false"',
        '  loading-screen="enabled: false"',
        '>',
        '  <a-assets timeout="20000">',
        '    <video id="panuelo-vid" src="/videos/panuelo.webm" muted playsinline crossorigin="anonymous" preload="auto"></video>',
        assetFoto ? `    ${assetFoto}` : '',
        '  </a-assets>',
        '',
        `  <a-camera id="camara-ar" position="0 ${Y_OJOS} 0"`,
        '    look-controls="enabled: true; magicWindowTrackingEnabled: true; touchEnabled: false; reverseMouseDrag: false"',
        '    wasd-controls="enabled: false"',
        '    fov="70"',
        '  ></a-camera>',
        '',
        // ── Pañuelo ──────────────────────────────────────────────────────────
        '  <a-video',
        '    id="columnas-vmj"',
        '    src="#panuelo-vid"',
        '    width="3.5" height="3"',
        `    position="0 -3 ${Z_BASE}"`,
        '    rotation="0 0 0"',
        '    scale="0.8 0.8 0.8"',
        '    material="transparent: true; alphaTest: 0.01; side: double"',
        `    animation__subir="property: position; to: 0 0.2 ${Z_BASE}; dur: 1800; easing: easeOutCubic; startEvents: escena-lista"`,
        '    animation__crecer="property: scale; to: 1.8 1.8 1.8; dur: 1800; easing: easeOutCubic; startEvents: escena-lista"',
        '  ></a-video>',
        '',
        // ── Panel de información — desactivado temporalmente ─────────────────

        '</a-scene>',
      ].join('\n')

      // Canvas transparente
      const aplicarAlpha = () => {
        const canvas = wrapper.querySelector('canvas') as HTMLCanvasElement | null
        if (canvas) Object.assign(canvas.style, {
          background: 'transparent', position: 'absolute',
          inset: '0', width: '100%', height: '100%',
        })
      }
      setTimeout(aplicarAlpha, 100)
      setTimeout(aplicarAlpha, 600)

      // ── Gestos touch ──────────────────────────────────────────────────────────
      let touches: Record<number, {x:number, y:number}> = {}
      let lastPinchDist  = 0
      let lastTwoFingerY = 0

      const getEntity = () => document.getElementById('columnas-vmj') as any

      const getPosicion = () => {
        const e = getEntity()
        if (!e) return { x: 0, y: -1.6, z: Z_BASE }
        const p = e.getAttribute('position') as any
        return { x: parseFloat(p?.x ?? 0), y: parseFloat(p?.y ?? -1.6), z: parseFloat(p?.z ?? Z_BASE) }
      }

      const getRotacion = () => {
        const e = getEntity()
        if (!e) return { x: 0, y: 0, z: 0 }
        const r = e.getAttribute('rotation') as any
        return { x: parseFloat(r?.x ?? 0), y: parseFloat(r?.y ?? 0), z: parseFloat(r?.z ?? 0) }
      }

      const setPosicion = (x: number, y: number, z: number) => {
        const e = getEntity()
        if (!e) return
        e.setAttribute('position', `${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`)
      }

      const setRotacion = (y: number) => {
        const e = getEntity()
        if (e) e.setAttribute('rotation', `0 ${y.toFixed(1)} 0`)
      }

      const onTouchStart = (ev: TouchEvent) => {
        Array.from(ev.changedTouches).forEach(t => {
          touches[t.identifier] = { x: t.clientX, y: t.clientY }
        })
        if (Object.keys(touches).length === 2) {
          const ids  = Object.keys(touches).map(Number)
          const t0   = touches[ids[0]], t1 = touches[ids[1]]
          lastPinchDist  = Math.hypot(t1.x - t0.x, t1.y - t0.y)
          lastTwoFingerY = (t0.y + t1.y) / 2
        }
      }

      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault()
        const ids = Object.keys(touches).length

        if (ids === 1) {
          const t    = ev.changedTouches[0]
          const prev = touches[t.identifier]
          if (!prev) return
          const dx = t.clientX - prev.x
          touches[t.identifier] = { x: t.clientX, y: t.clientY }
          const rot = getRotacion()
          setRotacion(rot.y + dx * 0.5)
          setOffsetY(v => { return v })

        } else if (ids === 2) {
          const tList = Array.from(ev.changedTouches)
          tList.forEach(t => { if (touches[t.identifier]) touches[t.identifier] = { x: t.clientX, y: t.clientY } })

          const tIds  = Object.keys(touches).map(Number)
          const t0    = touches[tIds[0]], t1 = touches[tIds[1]]
          const dist  = Math.hypot(t1.x - t0.x, t1.y - t0.y)
          const midY  = (t0.y + t1.y) / 2

          if (lastPinchDist > 0) {
            const deltaDist = dist - lastPinchDist
            const pos = getPosicion()
            const newZ = Math.max(-25, Math.min(-4, pos.z - deltaDist * 0.04))
            setPosicion(pos.x, pos.y, newZ)
            setZoom(Math.abs(newZ / Z_BASE))
          }
          lastPinchDist = dist

          if (lastTwoFingerY > 0) {
            const deltaY = lastTwoFingerY - midY
            const pos = getPosicion()
            const newY = Math.max(-8, Math.min(6, pos.y + deltaY * 0.012))
            setPosicion(pos.x, newY, pos.z)
            setOffsetY(newY + 1.6)
          }
          lastTwoFingerY = midY
        }
      }

      const onTouchEnd = (ev: TouchEvent) => {
        Array.from(ev.changedTouches).forEach(t => { delete touches[t.identifier] })
        if (Object.keys(touches).length < 2) { lastPinchDist = 0; lastTwoFingerY = 0 }
      }

      wrapper.addEventListener('touchstart',  onTouchStart as any, { passive: false })
      wrapper.addEventListener('touchmove',   onTouchMove  as any, { passive: false })
      wrapper.addEventListener('touchend',    onTouchEnd   as any, { passive: true })
      wrapper.addEventListener('touchcancel', onTouchEnd   as any, { passive: true })

      const scene = document.getElementById('escena-ar') as any
      sceneRef.current = scene

      // ── onLoaded: animaciones de entrada + loop del pañuelo ──────────────────
      const onLoaded = () => {
        aplicarAlpha()
        setArListo(true)
        const pos = getPosicion()
        setPosicion(pos.x, -1.6 + offsetY, Z_BASE * zoom)

        const panuelo = document.getElementById('columnas-vmj') as any

        // ── Posiciones disponibles para el pañuelo (x, z) ──────────────────
        const SPOTS = [
          { x:  0,  z: -12 },
          { x: -4,  z: -12 },
          { x:  4,  z: -12 },
          { x:  0,  z: -15 },
          { x: -3,  z: -10 },
          { x:  3,  z: -10 },
          { x: -2,  z: -14 },
          { x:  2,  z: -14 },
        ]

        let spotActual = 0

        const animarEnSpot = (idx: number, evento: string) => {
          const { x, z } = SPOTS[idx]
          if (!panuelo) return
          panuelo.setAttribute('position', `${x} -3 ${z}`)
          panuelo.setAttribute('scale', '0.8 0.8 0.8')
          panuelo.setAttribute('animation__subir',  `property: position; to: ${x} 0.2 ${z}; dur: 1800; easing: easeOutCubic; startEvents: ${evento}`)
          panuelo.setAttribute('animation__crecer', `property: scale;    to: 1.8 1.8 1.8;    dur: 1800; easing: easeOutCubic; startEvents: ${evento}`)
          setTimeout(() => panuelo.emit(evento), 50)
        }

        const vidEl = document.getElementById('panuelo-vid') as HTMLVideoElement | null

        const onEnded = () => {
          let siguiente: number
          do {
            siguiente = Math.floor(Math.random() * SPOTS.length)
          } while (siguiente === spotActual)
          spotActual = siguiente
          animarEnSpot(siguiente, 'siguiente-entrada')
          vidEl?.play()
        }

        vidEl?.addEventListener('ended', onEnded)

        const iniciarPrimera = () => {
          animarEnSpot(0, 'escena-lista')
          vidEl?.play()
          setHudListo(true)
        }

        if (vidEl && vidEl.readyState < 3) {
          vidEl.addEventListener('canplay', () => setTimeout(iniciarPrimera, 200), { once: true })
        } else {
          setTimeout(iniciarPrimera, 500)
        }
      }

      scene.addEventListener('loaded', onLoaded)
    }

    montar()

    return () => {
      const contenedor = document.getElementById('ar-container')
      const scene = document.getElementById('escena-ar') as any
      if (scene) scene.removeEventListener('loaded', () => {})
      const wrapper = contenedor?.querySelector('div') as HTMLElement | null
      if (wrapper) {
        wrapper.removeEventListener('touchstart',  () => {})
        wrapper.removeEventListener('touchmove',   () => {})
        wrapper.removeEventListener('touchend',    () => {})
        wrapper.removeEventListener('touchcancel', () => {})
      }
      const vid = document.getElementById('panuelo-vid') as HTMLVideoElement | null
      if (vid) vid.onended = null
      const bgVideo = document.getElementById('camara-bg') as HTMLVideoElement | null
      if (bgVideo?.srcObject) {
        (bgVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      }
      if (contenedor) contenedor.innerHTML = ''
      setArListo(false)
    }
  }, [scriptsOk, fase, baldosaActiva])

  // ── 6. Aplicar controles AR en tiempo real ───────────────────────────────────
  useEffect(() => {
    if (fase !== 'ar' || !arListo) return

    const entidad = document.getElementById('columnas-vmj') as any
    if (entidad) {
      const Z_DIST = -12 * zoom
      const posY   = -1.6 + offsetY
      entidad.setAttribute('position', '0 ' + posY.toFixed(2) + ' ' + Z_DIST.toFixed(2))
      entidad.setAttribute('rotation', '0 ' + rotY.toFixed(1) + ' 0')
    }

    localStorage.setItem('ar_offset_y', offsetY.toString())
    localStorage.setItem('ar_rot_y',    rotY.toString())
    localStorage.setItem('ar_zoom',     zoom.toString())
  }, [offsetY, rotY, zoom, fase, arListo])

  // ── HUD aerosol: animar letras cuando la escena está lista ───────────────────
  useEffect(() => {
    if (!hudListo || !baldosaActiva) return

    const COLORES_SUB = [
      '#ff1a1a','#ff4400','#ffcc00',
      '#00dd44','#0088ff','#cc00ff',
      '#ff0066','#00ccff','#ff6600',
    ]
    const DELAY_TITULO   = 280
    const DELAY_CONSIGNA = 190
    const ESPERA_INICIAL = 400

    const colorAleatorio = (excluir: string) => {
      let c: string
      do { c = COLORES_SUB[Math.floor(Math.random() * COLORES_SUB.length)] }
      while (c === excluir)
      return c
    }

    const wrap     = document.getElementById('hud-titulo-wrap')
    const sep      = document.getElementById('hud-sep')
    const consigna = document.getElementById('hud-consigna')
    if (!wrap || !sep || !consigna) return

    sep.style.opacity = '0'
    consigna.innerHTML = ''
    wrap.innerHTML = ''

    const chars = baldosaActiva.nombre.split('')
    const animables: HTMLElement[] = []

    chars.forEach(ch => {
      if (ch === ' ') {
        const esp = document.createElement('span')
        esp.className = 'espacio-hud-ar'
        wrap.appendChild(esp)
      } else {
        const span = document.createElement('span')
        span.className = 'letra-hud-ar'
        span.setAttribute('data-l', ch)
        span.textContent = ch
        wrap.appendChild(span)
        animables.push(span)
      }
    })

    const timers: ReturnType<typeof setTimeout>[] = []

    animables.forEach((el, i) => {
      timers.push(setTimeout(() => {
        el.classList.add('pintada')
      }, ESPERA_INICIAL + i * DELAY_TITULO))
    })

    const finTitulo = ESPERA_INICIAL + animables.length * DELAY_TITULO + 600

    timers.push(setTimeout(() => {
      if (sep) { sep.style.transition = 'opacity 0.6s'; sep.style.opacity = '1' }
    }, finTitulo - 100))

    const CONSIGNA = 'Florecerán Pañuelos'
    let colorPrev = ''
    CONSIGNA.split('').forEach(ch => {
      const span = document.createElement('span')
      span.textContent = ch
      if (ch.trim() !== '') {
        const c = colorAleatorio(colorPrev)
        colorPrev = c
        span.style.color = c
        span.style.textShadow = `0 0 6px ${c}99, 0 0 16px ${c}44`
      }
      consigna.appendChild(span)
    })

    CONSIGNA.split('').forEach((_, i) => {
      timers.push(setTimeout(() => {
        const spans = consigna.querySelectorAll('span')
        if (spans[i]) (spans[i] as HTMLElement).style.opacity = '1'
      }, finTitulo + 200 + i * DELAY_CONSIGNA))
    })

    return () => timers.forEach(clearTimeout)
  }, [hudListo, baldosaActiva])

  // ── 7. Toggle del panel de información ───────────────────────────────────────
  // Maneja visible con setAttribute en lugar de opacity, porque A-Frame no
  // propaga opacity a entidades hijas. Secuencia:
  //   Mostrar: visible=true → reset scale → emit panel-mostrar (con delay mínimo)
  //   Ocultar: emit panel-ocultar → visible=false después de que termina la animación (420ms)
  const togglePanel = useCallback(() => {
    const panel = document.getElementById('panel-baldosa') as any
    if (!panel) return

    setPanelVisible(prev => {
      const siguiente = !prev
      if (siguiente) {
        panel.setAttribute('visible', 'true')
        panel.setAttribute('scale', '0.85 0.85 0.85')
        setTimeout(() => panel.emit('panel-mostrar'), 20)
      } else {
        panel.emit('panel-ocultar')
        setTimeout(() => panel.setAttribute('visible', 'false'), 420)
      }
      return siguiente
    })
  }, [])

  // ── 8. Handlers de acciones del usuario ───────────────────────────────────

  const verEscenaAR = useCallback(() => {
    if (!baldosaCercana) return
    setScriptsOk(false)
    setArListo(false)
    setBaldosaActiva(null)
    setTimeout(() => {
      setBaldosaActiva(baldosaCercana)
      setFase('ar')
    }, 50)
    setGuardado(false)
    setFotoOk(false)
    setEscaneando(false)
  }, [baldosaCercana])

  const marcarVisitadaYVerAR = useCallback(() => {
    if (!baldosaCercana) return
    const id = baldosaCercana.codigo || baldosaCercana.id
    fetch(`/api/baldosas/${id}`, { method: 'PATCH' }).catch(() => {})
    verEscenaAR()
  }, [baldosaCercana, verEscenaAR])

  const cerrarAR = useCallback(() => {
    const bgVideo = document.getElementById('camara-bg') as HTMLVideoElement | null
    if (bgVideo && bgVideo.srcObject) {
      (bgVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      bgVideo.srcObject = null
    }
    const arContainer = document.getElementById('ar-container')
    if (arContainer) arContainer.innerHTML = ''

    setScriptsOk(false)
    setArListo(false)
    setHudListo(false)
    setFase('ficha')

    setBaldosaActiva(prev => {
      if (!prev) return prev
      const id = prev.codigo || prev.id
      fetch(`/api/baldosas/${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.baldosa?.vecesEscaneada !== undefined) {
            setBaldosaActiva(b => b ? { ...b, vecesEscaneada: data.baldosa.vecesEscaneada } : b)
          }
        })
        .catch(() => {})
      return prev
    })
  }, [])

  const volverACaminar = useCallback(() => {
    const bgVideo = document.getElementById('camara-bg') as HTMLVideoElement | null
    if (bgVideo && bgVideo.srcObject) {
      (bgVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      bgVideo.srcObject = null
    }
    const arContainer = document.getElementById('ar-container')
    if (arContainer) arContainer.innerHTML = ''

    setBaldosaActiva(null)
    setBaldosaCercana(null)
    setScriptsOk(false)
    setArListo(false)
    setHudListo(false)
    window.location.href = '/mapa'
  }, [])

  const escanearYGuardar = useCallback(async () => {
    if (!baldosaActiva || escaneando || fotoOk) return
    setEscaneando(true)

    setFlash(true)
    setTimeout(() => setFlash(false), 350)

    try {
      const aScene  = document.getElementById('escena-ar') as any
      const aCanvas = aScene?.canvas as HTMLCanvasElement | null

      if (aScene?.renderer) {
        aScene.renderer.render(aScene.object3D, aScene.camera)
      }

      await new Promise<void>(resolve => requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      ))

      const video = document.getElementById('camara-bg') as HTMLVideoElement | null
      const W = window.innerWidth
      const H = window.innerHeight
      const offscreen = document.createElement('canvas')
      offscreen.width  = W
      offscreen.height = H
      const ctx = offscreen.getContext('2d')!

      if (video && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, W, H)
      } else {
        ctx.fillStyle = '#0a121c'
        ctx.fillRect(0, 0, W, H)
      }
      if (aCanvas) {
        ctx.drawImage(aCanvas, 0, 0, W, H)
      }

      const fotoBase64 = offscreen.toDataURL('image/jpeg', 0.82)

      const entrada = {
        id:        Date.now(),
        baldosaId: baldosaActiva.codigo || baldosaActiva.id,
        nombre:    baldosaActiva.nombre,
        ubicacion: baldosaActiva.direccion || baldosaActiva.barrio || 'Buenos Aires',
        lat:       baldosaActiva.lat,
        lng:       baldosaActiva.lng,
        foto:      fotoBase64,
        fecha:     new Date().toISOString(),
      }

      localStorage.setItem('recorremo_foto_pendiente', JSON.stringify(entrada))
      setFotoOk(true)
      window.location.href = '/scanner/foto'
    } catch {
      // Silencioso
    } finally {
      setEscaneando(false)
    }
  }, [baldosaActiva, escaneando, fotoOk])

  // ── 9. Renders por fase ───────────────────────────────────────────────────

  if (fase === 'verificando') {
    return (
      <div style={{ ...estilos.pantallaCentrada, background: 'var(--color-stone)' }}>
        <div style={estilos.spinner} />
      </div>
    )
  }

  if (fase === 'iniciando') {
    return (
      <div style={estilos.pantallaCentrada}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌎</div>
        <h1 style={estilos.titulo}>Baldosas por la Memoria</h1>
        <p style={estilos.subtitulo}>
          Caminá por Buenos Aires y descubrí las baldosas que honran a los desaparecidos.
          Cuando te acerques a una, verás su historia.
        </p>
        <button onClick={iniciarGPS} style={estilos.btnPrimario}>
          🌎 Activar ubicación
        </button>
        <a href="/mapa" style={estilos.btnSecundario}>
          🗺️ Ver mapa primero
        </a>
      </div>
    )
  }

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

  if (fase === 'caminando') {
    return (
      <div style={estilos.pantallaOscura}>
        <div style={estilos.navBar}>
          <a href="/" style={estilos.navLink}>← Inicio</a>
          <a href="/mapa" style={estilos.navLink}>🗺️ Mapa</a>
        </div>
        <div style={estilos.centradoVertical}>
          <div style={estilos.radar}>
            <div style={estilos.radarPulso1} />
            <div style={estilos.radarPulso2} />
            <span style={{ fontSize: '2.5rem', position: 'relative', zIndex: 2 }}>🌎</span>
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

  if (fase === 'cerca' && baldosaCercana) {
    return (
      <div style={estilos.pantallaOscura}>
        <style>{`
          @media (min-width: 768px) {
            .modal-cerca-wrap {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: calc(100vh - 60px);
            }
            .modal-cerca-card {
              width: 420px !important;
              margin: 1.5rem auto !important;
            }
            .modal-cerca-foto img {
              width: 80px !important;
              height: 100px !important;
            }
            .modal-cerca-nombre {
              font-size: 1.2rem !important;
            }
            .modal-cerca-banner {
              font-size: 0.82rem !important;
              padding: 0.65rem 1rem !important;
            }
            .modal-cerca-badge {
              font-size: 0.75rem !important;
            }
            .modal-cerca-body {
              padding: 1.1rem !important;
            }
            .modal-cerca-desc {
              font-size: 0.82rem !important;
            }
            .modal-cerca-btn-primario {
              padding: 0.65rem !important;
              font-size: 0.9rem !important;
            }
            .modal-cerca-btn-secundario {
              padding: 0.5rem !important;
              font-size: 0.82rem !important;
            }
          }
        `}</style>
        <div style={estilos.navBar}>
          <a href="/" style={estilos.navLink}>← Inicio</a>
          <a href="/mapa" style={estilos.navLink}>🗺️ Mapa</a>
        </div>
        <div className="modal-cerca-wrap">
          <div className="modal-cerca-card" style={estilos.cardNotificacion}>
            <div className="modal-cerca-banner" style={estilos.bannerDeteccion}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f4f8' }}>Baldosa encontrada</span>
                {distancia !== null && (
                  <span className="modal-cerca-badge" style={{ ...estilos.badgeDistancia, padding: 0, background: 'none', color: '#90b4ce', fontSize: '0.78rem' }}>
                    Estás a {formatearDistancia(distancia)} de la baldosa
                  </span>
                )}
              </div>
              {baldosaCercana.vecesEscaneada !== undefined && (
                <div style={{
                  textAlign: 'center',
                  padding: '0.35rem 0.85rem',
                  background: 'rgba(37,99,235,0.2)',
                  borderRadius: '8px',
                  border: '1px solid rgba(37,99,235,0.35)',
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#60a5fa', lineHeight: 1 }}>
                    {baldosaCercana.vecesEscaneada.toLocaleString('es-AR')}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#90b4ce', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.15rem' }}>
                    {baldosaCercana.vecesEscaneada === 1 ? 'visita' : 'visitas'}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-cerca-body" style={{ padding: '1.5rem' }}>
              {baldosaCercana.fotoUrl && (
                <div className="modal-cerca-foto" style={estilos.contenedorFoto}>
                  <img src={baldosaCercana.fotoUrl} alt={baldosaCercana.nombre} style={estilos.fotoThumbnail} />
                </div>
              )}
              <h2 className="modal-cerca-nombre" style={estilos.nombreBaldosa}>{baldosaCercana.nombre}</h2>
              {baldosaCercana.direccion && (
                <p style={estilos.direccion}>🌎 {baldosaCercana.direccion}</p>
              )}
              {baldosaCercana.descripcion && (
                <p className="modal-cerca-desc" style={estilos.descripcionCorta}>
                  {baldosaCercana.descripcion.slice(0, 120)}
                  {baldosaCercana.descripcion.length > 120 ? '…' : ''}
                </p>
              )}
              <p style={{ ...estilos.subtitulo, fontSize: '0.9rem', marginTop: '1rem' }}>
                {baldosaCercana.mensajeAR}
              </p>
              <div style={estilos.botonesAccion}>
                {/* Botón escanear — solo cuando ya llegaste (≤ 30m) */}
                {distancia !== null && distancia <= 30 && (
                  <button
                    className="modal-cerca-btn-primario"
                    onClick={marcarVisitadaYVerAR}
                    style={{
                      ...estilos.btnPrimario,
                      background: '#1d4ed8',
                      boxShadow: '0 0 20px rgba(37,99,235,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '1.05rem',
                    }}
                  >
                    📸 Escanear baldosa
                  </button>
                )}
                <button className="modal-cerca-btn-primario" onClick={marcarVisitadaYVerAR} style={estilos.btnPrimario}>
                  Marcar como visitada
                </button>
                <button className="modal-cerca-btn-secundario" onClick={volverACaminar} style={estilos.btnSecundario}>
                  Seguir caminando
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Escena AR activa ──────────────────────────────────────────────────────
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

        {/* ── HUD aerosol — parte superior ── */}
        {arListo && (
          <div style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            right: 0,
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
            padding: '0 1rem',
          }}>
            <div
              id="hud-titulo-wrap"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                lineHeight: 1.1,
              }}
            />
            <div
              id="hud-sep"
              style={{
                width: '40px',
                height: '1px',
                background: 'rgba(255,255,255,0.25)',
                opacity: 0,
                margin: '2px auto',
              }}
            />
            <div
              id="hud-consigna"
              className="consigna-hud-ar"
              style={{
                fontFamily: "'Oswald', 'Impact', 'Arial Black', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                textAlign: 'center',
                lineHeight: 1,
              }}
            />
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

        {/* ── Botón escanear — esquina inferior izquierda ── */}
        {arListo && (
          <button
            onClick={escanearYGuardar}
            disabled={escaneando || fotoOk}
            style={{
              position: 'absolute',
              bottom: '5rem',
              left: '1rem',
              zIndex: 200,
              width: '3.2rem',
              height: '3.2rem',
              background: fotoOk
                ? 'rgba(22, 101, 52, 0.92)'
                : 'rgba(10, 18, 28, 0.82)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: '50%',
              fontSize: '1.4rem',
              cursor: fotoOk ? 'default' : 'pointer',
              backdropFilter: 'blur(8px)',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: escaneando ? 0.6 : 1,
              transition: 'transform 0.1s, opacity 0.2s',
              transform: escaneando ? 'scale(0.92)' : 'scale(1)',
            }}
          >
            {fotoOk ? '✓' : escaneando ? '⏳' : '📸'}
          </button>
        )}

        {/* Hint gestos — desaparece al primer toque */}
        {arListo && offsetY === 0 && zoom === 1 && (
          <div style={{ ...estilos.instruccionAR, fontSize: '0.75rem', lineHeight: 1.4 }}>
            1 dedo: rotar · Pinch: zoom · 2 dedos arriba/abajo: altura
          </div>
        )}

        {/* Flash de cámara */}
        {flash && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'white',
            zIndex: 300,
            pointerEvents: 'none',
            animation: 'shutterFlash 0.35s ease-out forwards',
          }} />
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

          <h1 style={{ ...estilos.nombreBaldosa, fontSize: '2rem', marginTop: '0.5rem' }}>
            {baldosaActiva.nombre}
          </h1>

          {baldosaActiva.direccion && (
            <p style={estilos.direccion}>🌎 {baldosaActiva.direccion}</p>
          )}

          {(baldosaActiva.vecesEscaneada !== undefined && baldosaActiva.vecesEscaneada > 0) && (
            <p style={{ ...estilos.direccion, color: '#60a5fa' }}>
              👁 Vista {baldosaActiva.vecesEscaneada.toLocaleString('es-AR')} {baldosaActiva.vecesEscaneada === 1 ? 'vez' : 'veces'} en AR
            </p>
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

          <div style={{ ...estilos.botonesAccion, marginTop: '2rem' }}>
            <button onClick={verEscenaAR} style={estilos.btnSecundario}>
              ✨ Ver AR de nuevo
            </button>
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
