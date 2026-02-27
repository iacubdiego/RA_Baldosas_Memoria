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
  const [capturando, setCapturando] = useState(false)
  const [capturaOk, setCapturaOk] = useState(false)

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

  // ── 3. Cargar A-Frame cuando el usuario elige ver la escena ──────────────────
  // Modo: cámara web pura, objetos fijos frente a la cámara (sin GPS)
  useEffect(() => {
    if (fase !== 'ar' || scriptsOk) return

    async function cargarScripts() {
      if (!(window as any).AFRAME) {
        await loadScript('https://aframe.io/releases/1.4.1/aframe.min.js')
        await delay(600)
      }
      // aframe-extras para animation-mixer (reproducir animación del GLB)
      if (!(window as any).AFRAME?.systems?.['animation-mixer']) {
        await loadScript(
          'https://cdn.jsdelivr.net/npm/aframe-extras@7.2.0/dist/aframe-extras.min.js'
        )
        await delay(400)
      }
      setScriptsOk(true)
    }

    cargarScripts().catch((e) => {
      console.error('Error cargando scripts AR:', e)
      setErrorMsg('No se pudieron cargar las librerías. Verificá tu conexión a internet.')
      setFase('error')
    })
  }, [fase, scriptsOk])

  // ── 4. Montar escena A-Frame ────────────────────────────────────────────────
  // Composición:
  //   z-index 0 → <video> cámara trasera, fondo real
  //   z-index 1 → canvas A-Frame con alpha:true (transparente)
  // Gestos touch sobre el canvas:
  //   1 dedo arrastra horizontal → rota grupo en Y
  //   2 dedos pinch              → zoom (cambia Z)
  //   2 dedos swipe vertical     → altura (cambia Y)
  useEffect(() => {
    if (!scriptsOk || fase !== 'ar' || !baldosaActiva) return

    const contenedor = document.getElementById('ar-container')
    if (!contenedor) return

    contenedor.innerHTML = ''
    setArListo(false)

    const { nombre, mensajeAR } = baldosaActiva
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

    const Z_BASE  = -12   // distancia base en metros
    const Y_OJOS  = 1.6

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
      '    <a-asset-item id="panuelo-glb" src="/models/logo_flores.glb"></a-asset-item>',
      '  </a-assets>',
      '',
      '  <a-camera',
      '    id="camara-ar"',
      '    position="0 ' + Y_OJOS + ' 0"',
      '    look-controls="enabled: true; magicWindowTrackingEnabled: true; touchEnabled: false; reverseMouseDrag: false"',
      '    wasd-controls="enabled: false"',
      '    fov="70"',
      '  ></a-camera>',
      '',
      // Pañuelo: empieza abajo pequeño, sube y se agranda
      '  <a-entity',
      '    id="columnas-vmj"',
      '    gltf-model="#panuelo-glb"',
      '    position="0 -3 ' + Z_BASE + '"',
      '    rotation="0 0 0"',
      '    scale="0.8 0.8 0.8"',
      '    animation__subir="property: position; to: 0 0 ' + Z_BASE + '; dur: 1800; easing: easeOutCubic; startEvents: escena-lista"',
      '    animation__crecer="property: scale; to: 1.8 1.8 1.8; dur: 1800; easing: easeOutCubic; startEvents: escena-lista"',
      '    animation-mixer="clip: *; loop: repeat;"',
      '  ></a-entity>',
      '',
      // Nombre de la víctima
      '  <a-text id="txt-nombre"',
      '    value="' + nombreSafe + '"',
      '    position="0 3.5 ' + Z_BASE + '"',
      '    align="center" width="6" color="#f0e6d3" wrap-count="22"',
      '    animation__aparecer="property: opacity; from: 0; to: 1; dur: 1200; delay: 1400; easing: easeInOutQuad; startEvents: escena-lista"',
      '    opacity="0"',
      '  ></a-text>',
      '',
      // Texto fijo: Verdad, Memoria y Justicia
      '  <a-text id="txt-mensaje"',
      '    value="Verdad, Memoria y Justicia"',
      '    position="0 2.7 ' + Z_BASE + '"',
      '    align="center" width="5" color="#90b4ce" wrap-count="30"',
      '    animation__aparecer="property: opacity; from: 0; to: 1; dur: 1200; delay: 1600; easing: easeInOutQuad; startEvents: escena-lista"',
      '    opacity="0"',
      '  ></a-text>',
      '',
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
    // Estado local de gestos (no necesita re-render de React)
    let touches: Record<number, {x:number, y:number}> = {}
    let lastPinchDist  = 0
    let lastTwoFingerY = 0

    const getEntity = () => document.getElementById('columnas-vmj') as any
    const getTxtN   = () => document.getElementById('txt-nombre')   as any
    const getTxtM   = () => document.getElementById('txt-mensaje')  as any

    // Lee posición actual del entity como objeto {x,y,z}
    const getPosicion = () => {
      const e = getEntity()
      if (!e) return { x: 0, y: -1.6, z: Z_BASE }
      const p = e.getAttribute('position') as any
      return { x: parseFloat(p?.x ?? 0), y: parseFloat(p?.y ?? -1.6), z: parseFloat(p?.z ?? Z_BASE) }
    }

    // Lee rotación actual del entity
    const getRotacion = () => {
      const e = getEntity()
      if (!e) return { x: 0, y: 0, z: 0 }
      const r = e.getAttribute('rotation') as any
      return { x: parseFloat(r?.x ?? 0), y: parseFloat(r?.y ?? 0), z: parseFloat(r?.z ?? 0) }
    }

    const setPosicion = (x: number, y: number, z: number) => {
      const e = getEntity(); const n = getTxtN(); const m = getTxtM()
      if (!e) return
      e.setAttribute('position', `${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`)
      if (n) n.setAttribute('position', `0 ${(y + 6.4).toFixed(2)} ${z.toFixed(2)}`)
      if (m) m.setAttribute('position', `0 ${(y + 5.7).toFixed(2)} ${z.toFixed(2)}`)
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
        // ── 1 dedo: rotar grupo en Y ──────────────────────────────────────────
        const t    = ev.changedTouches[0]
        const prev = touches[t.identifier]
        if (!prev) return
        const dx = t.clientX - prev.x
        touches[t.identifier] = { x: t.clientX, y: t.clientY }

        const rot = getRotacion()
        setRotacion(rot.y + dx * 0.5)          // 0.5° por pixel
        setOffsetY(v => { return v })           // no-op para no re-render innecesario

      } else if (ids === 2) {
        // ── 2 dedos: pinch = zoom, swipe vertical = altura ────────────────────
        const tList = Array.from(ev.changedTouches)
        tList.forEach(t => { if (touches[t.identifier]) touches[t.identifier] = { x: t.clientX, y: t.clientY } })

        const tIds  = Object.keys(touches).map(Number)
        const t0    = touches[tIds[0]], t1 = touches[tIds[1]]
        const dist  = Math.hypot(t1.x - t0.x, t1.y - t0.y)
        const midY  = (t0.y + t1.y) / 2

        // Pinch zoom: cambia Z
        if (lastPinchDist > 0) {
          const deltaDist = dist - lastPinchDist
          const pos = getPosicion()
          const newZ = Math.max(-25, Math.min(-4, pos.z - deltaDist * 0.04))
          setPosicion(pos.x, pos.y, newZ)
          // Sincronizar estado React para localStorage
          setZoom(Math.abs(newZ / Z_BASE))
        }
        lastPinchDist = dist

        // Swipe vertical dos dedos: cambia altura
        if (lastTwoFingerY > 0) {
          const deltaY = lastTwoFingerY - midY   // invertido: arriba = sube
          const pos = getPosicion()
          const newY = Math.max(-8, Math.min(6, pos.y + deltaY * 0.012))
          setPosicion(pos.x, newY, pos.z)
          setOffsetY(newY + 1.6)   // sincronizar estado React
        }
        lastTwoFingerY = midY
      }
    }

    const onTouchEnd = (ev: TouchEvent) => {
      Array.from(ev.changedTouches).forEach(t => { delete touches[t.identifier] })
      if (Object.keys(touches).length < 2) { lastPinchDist = 0; lastTwoFingerY = 0 }
    }

    // Adjuntar listeners al wrapper (no al canvas directamente)
    wrapper.addEventListener('touchstart',  onTouchStart as any, { passive: false })
    wrapper.addEventListener('touchmove',   onTouchMove  as any, { passive: false })
    wrapper.addEventListener('touchend',    onTouchEnd   as any, { passive: true })
    wrapper.addEventListener('touchcancel', onTouchEnd   as any, { passive: true })

    const scene = document.getElementById('escena-ar') as any
    sceneRef.current = scene

    const onLoaded = () => {
      aplicarAlpha()
      setArListo(true)
      // Aplicar offsets guardados
      const pos = getPosicion()
      setPosicion(pos.x, -1.6 + offsetY, Z_BASE * zoom)

      // Disparar evento para iniciar las animaciones de entrada
      const panuelo = document.getElementById('columnas-vmj') as any
      const txtN    = document.getElementById('txt-nombre')   as any
      const txtM    = document.getElementById('txt-mensaje')  as any
      setTimeout(() => {
        panuelo?.emit('escena-lista')
        txtN?.emit('escena-lista')
        txtM?.emit('escena-lista')
      }, 300)
    }
    scene.addEventListener('loaded', onLoaded)

    return () => {
      scene.removeEventListener('loaded', onLoaded)
      wrapper.removeEventListener('touchstart',  onTouchStart as any)
      wrapper.removeEventListener('touchmove',   onTouchMove  as any)
      wrapper.removeEventListener('touchend',    onTouchEnd   as any)
      wrapper.removeEventListener('touchcancel', onTouchEnd   as any)
      if (streamActivo) streamActivo.getTracks().forEach(t => t.stop())
      contenedor.innerHTML = ''
      setArListo(false)
    }
  }, [scriptsOk, fase, baldosaActiva])



  // ── 5. Aplicar controles AR en tiempo real ───────────────────────────────────
  useEffect(() => {
    if (fase !== 'ar' || !arListo) return

    // Altura
    const entidad = document.getElementById('columnas-vmj') as any
    if (entidad) {
      const Z_DIST = -12 * zoom           // zoom acerca/aleja cambiando Z
      const posY   = -1.6 + offsetY
      entidad.setAttribute('position', '0 ' + posY.toFixed(2) + ' ' + Z_DIST.toFixed(2))
      // Rotación del grupo de columnas (eje Y)
      entidad.setAttribute('rotation', '0 ' + rotY.toFixed(1) + ' 0')
      // Texto sigue al grupo
      const txtNombre  = document.getElementById('txt-nombre')  as any
      const txtMensaje = document.getElementById('txt-mensaje') as any
      if (txtNombre)  txtNombre.setAttribute('position',  '0 ' + (posY + 6.5).toFixed(2) + ' ' + Z_DIST.toFixed(2))
      if (txtMensaje) txtMensaje.setAttribute('position', '0 ' + (posY + 5.8).toFixed(2) + ' ' + Z_DIST.toFixed(2))
    }

    localStorage.setItem('ar_offset_y', offsetY.toString())
    localStorage.setItem('ar_rot_y',    rotY.toString())
    localStorage.setItem('ar_zoom',     zoom.toString())
  }, [offsetY, rotY, zoom, fase, arListo])

  // ── 6. Handlers de acciones del usuario ───────────────────────────────────

  const verEscenaAR = useCallback(() => {
    if (!baldosaCercana) return
    // Resetear estado AR para garantizar re-mount limpio de la escena
    setScriptsOk(false)
    setArListo(false)
    setBaldosaActiva(null)
    // Pequeño delay para que React procese el null antes de setear el valor real
    setTimeout(() => {
      setBaldosaActiva(baldosaCercana)
      setFase('ar')
    }, 50)
    setGuardado(false)
    setCapturaOk(false)
    setCapturando(false)

    // Incrementar contador — fire & forget, no bloquea la UX
    const id = baldosaCercana.codigo || baldosaCercana.id
    fetch(`/api/baldosas/${id}`, { method: 'PATCH' }).catch(() => {})
  }, [baldosaCercana])

  const cerrarAR = useCallback(() => {
    // Detener stream de cámara
    const bgVideo = document.getElementById('camara-bg') as HTMLVideoElement | null
    if (bgVideo && bgVideo.srcObject) {
      (bgVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      bgVideo.srcObject = null
    }
    const arContainer = document.getElementById('ar-container')
    if (arContainer) arContainer.innerHTML = ''

    setScriptsOk(false)
    setArListo(false)
    setFase('ficha')

    // Enriquecer baldosaActiva con vecesEscaneada actualizada
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
    // Detener stream de cámara AR si quedó activo
    const bgVideo = document.getElementById('camara-bg') as HTMLVideoElement | null
    if (bgVideo && bgVideo.srcObject) {
      (bgVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      bgVideo.srcObject = null
    }
    // Limpiar el contenedor AR por si acaso
    const arContainer = document.getElementById('ar-container')
    if (arContainer) arContainer.innerHTML = ''

    setBaldosaActiva(null)
    setBaldosaCercana(null)
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

  const capturarYGuardar = useCallback(async () => {
    if (!baldosaActiva || capturando || capturaOk) return
    setCapturando(true)

    try {
      // 1. Esperar al próximo frame renderizado antes de capturar
      await new Promise<void>(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)))

      // 2. Capturar escena siempre, antes de verificar auth
      const video   = document.getElementById('camara-bg') as HTMLVideoElement | null
      const aScene  = document.getElementById('escena-ar') as any
      const aCanvas = aScene?.canvas as HTMLCanvasElement | null

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

      // 3. Verificar auth
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        sessionStorage.setItem('captura_pendiente', JSON.stringify({
          baldosaId:     baldosaActiva.codigo || baldosaActiva.id,
          nombreVictima: baldosaActiva.nombre,
          fotoBase64,
          ubicacion:     baldosaActiva.direccion || baldosaActiva.barrio || 'Buenos Aires',
          lat:           baldosaActiva.lat,
          lng:           baldosaActiva.lng,
        }))
        window.location.href = `/auth?redirect=/scanner&pendiente=captura`
        return
      }

      // 4. Guardar en BD
      const res = await fetch('/api/recorridos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baldosaId:         baldosaActiva.codigo || baldosaActiva.id,
          nombreVictima:     baldosaActiva.nombre,
          fechaDesaparicion: '',
          fotoBase64,
          ubicacion:         baldosaActiva.direccion || baldosaActiva.barrio || 'Buenos Aires',
          lat:               baldosaActiva.lat,
          lng:               baldosaActiva.lng,
          notas:             'Captura AR',
        }),
      })

      const data = await res.json()
      if (res.ok || data.error?.includes('Ya has escaneado')) {
        setCapturaOk(true)
        setGuardado(true)
        setTimeout(() => { window.location.href = '/coleccion' }, 1200)
      }
    } catch {
      // Silencioso
    } finally {
      setCapturando(false)
    }
  }, [baldosaActiva, capturando, capturaOk])

  // ── 6. Renders por fase ───────────────────────────────────────────────────

  // Pantalla de inicio / pedido de permisos
  if (fase === 'iniciando') {
    return (
      <div style={estilos.pantallaCentrada}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌎</div>
        <h1 style={estilos.titulo}>Baldosas por la Memoria</h1>
        <p style={estilos.subtitulo}>
          Caminá por Buenos Aires y descubrí las baldosas que honran a los desaparecidos.
          Cuando te acerques a una, verás su historia.
        </p>
        <button
          onClick={iniciarGPS}
          style={estilos.btnPrimario}
        >
          🌎 Activar ubicación
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
            <span style={{ fontSize: '1.4rem' }}>🌎</span>
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
              {(baldosaCercana.categoria ?? 'histórico').toUpperCase()}
            </div>

            <h2 style={estilos.nombreBaldosa}>{baldosaCercana.nombre}</h2>

            {baldosaCercana.direccion && (
              <p style={estilos.direccion}>🌎 {baldosaCercana.direccion}</p>
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

        {/* ── Controles AR ─────────────────────────────────────────────── */}
        {arListo && (() => {
          const s: React.CSSProperties = {
            width: '2.8rem', height: '2.8rem',
            background: 'rgba(10,18,28,0.78)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '10px', color: 'white',
            fontSize: '1.1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', touchAction: 'manipulation',
          }
          const getE = () => document.getElementById('columnas-vmj') as any
          const getTN = () => document.getElementById('txt-nombre')  as any
          const getTM = () => document.getElementById('txt-mensaje') as any
          const getPos = () => {
            const e = getE(); if (!e) return {x:0,y:-1.6,z:-12}
            const p = e.getAttribute('position') as any
            return {x:+p.x,y:+p.y,z:+p.z}
          }
          const setPos = (x:number,y:number,z:number) => {
            const e=getE(),n=getTN(),m=getTM(); if(!e) return
            e.setAttribute('position',`${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`)
            if(n) n.setAttribute('position',`0 ${(y+6.4).toFixed(2)} ${z.toFixed(2)}`)
            if(m) m.setAttribute('position',`0 ${(y+5.7).toFixed(2)} ${z.toFixed(2)}`)
          }
          const getRot = () => { const e=getE(); if(!e) return 0; return +(e.getAttribute('rotation') as any)?.y||0 }

          return (
            <div style={{ position:'absolute', bottom:'5rem', right:'1rem', zIndex:200, display:'flex', flexDirection:'column', gap:'0.4rem', alignItems:'center' }}>
              {/* Altura */}
              <button style={s} onPointerDown={()=>{ const p=getPos(); setPos(p.x,Math.min(p.y+0.3,6),p.z); setOffsetY(v=>Math.min(v+0.3,6)) }} title="Subir">↑</button>
              {/* Zoom acercar */}
              <button style={s} onPointerDown={()=>{ const p=getPos(); setPos(p.x,p.y,Math.max(p.z+1.5,-4)); setZoom(v=>Math.max(v-0.15,0.3)) }} title="Acercar">🔍+</button>
              {/* Reset */}
              <button style={{...s, fontSize:'0.7rem', color:'#90b4ce'}} onPointerDown={()=>{
                setPos(0,-1.6,-12); setOffsetY(0); setZoom(1)
                const e=getE(); if(e) e.setAttribute('rotation','0 0 0')
                // Centrar cámara
                const cam=document.getElementById('camara-ar') as any
                if(cam?.components?.['look-controls']) {
                  cam.components['look-controls'].pitchObject.rotation.x=0
                  cam.components['look-controls'].yawObject.rotation.y=0
                }
              }} title="Reset">⊙</button>
              {/* Zoom alejar */}
              <button style={s} onPointerDown={()=>{ const p=getPos(); setPos(p.x,p.y,Math.min(p.z-1.5,-4)); setZoom(v=>Math.min(v+0.15,3)) }} title="Alejar">🔍−</button>
              {/* Bajar */}
              <button style={s} onPointerDown={()=>{ const p=getPos(); setPos(p.x,Math.max(p.y-0.3,-8),p.z); setOffsetY(v=>Math.max(v-0.3,-8)) }} title="Bajar">↓</button>
            </div>
          )
        })()}

        {/* ── Botón capturar — esquina inferior izquierda ──────────────── */}
        {arListo && (
          <button
            onClick={capturarYGuardar}
            disabled={capturando || capturaOk}
            style={{
              position: 'absolute',
              bottom: '5rem',
              left: '1rem',
              zIndex: 200,
              padding: '0.65rem 1rem',
              background: capturaOk
                ? 'rgba(22, 101, 52, 0.92)'
                : 'rgba(10, 18, 28, 0.82)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: '12px',
              fontSize: '1.3rem',
              cursor: capturaOk ? 'default' : 'pointer',
              backdropFilter: 'blur(8px)',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: capturando ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            <span>{capturaOk ? '✓' : capturando ? '⏳' : '📸'}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              {capturaOk ? 'Guardado' : capturando ? 'Guardando…' : 'Capturar'}
            </span>
          </button>
        )}

        {/* Hint gestos — desaparece al primer toque */}
        {arListo && offsetY === 0 && zoom === 1 && (
          <div style={{ ...estilos.instruccionAR, fontSize: '0.75rem', lineHeight: 1.4 }}>
            1 dedo: rotar · Pinch: zoom · 2 dedos arriba/abajo: altura
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

          <div style={estilos.chipCategoria}>{(baldosaActiva.categoria ?? 'histórico').toUpperCase()}</div>
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
