'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'public/images/nuncamas-avatar.jpg',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const baldosaIcon = new L.Icon({
  iconUrl: '/images/logo_flores.png',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
})

// Destino: mismo ícono del pañuelo/flores que las baldosas normales
const destinoIcon = new L.Icon({
  iconUrl: '/images/logo_flores.png',
  iconSize: [38, 48],
  iconAnchor: [19, 48],
  popupAnchor: [0, -48],
})

// Usuario: ícono de teléfono celular
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" fill="#1d4ed8" stroke="white" stroke-width="2.5"/>
      <rect x="10" y="7" width="8" height="14" rx="1.5" fill="white"/>
      <rect x="11.5" y="8.5" width="5" height="9" rx="0.5" fill="#1d4ed8"/>
      <circle cx="14" cy="19.5" r="0.9" fill="white"/>
    </svg>
  `),
  iconSize: [28, 28], iconAnchor: [14, 14],
})

// Recorrido escolar: png con fondo azul (pendiente)
const recorridoIcon = new L.Icon({
  iconUrl: '/images/logo_flores_fondo_azul.png',
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -44],
})

// Recorrido escolar: baldosa ya escaneada/marcada (tilde verde)
const recorridoMarcadaIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#16a34a;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 2px #16a34a;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;line-height:1;">✓</div>`,
  iconSize: [20,20], iconAnchor: [10,10],
})

// Escuela: marcador con emoji (más grande que las baldosas — es el punto central)
const escuelaIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:46px;height:46px;background:#1a2a3a;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 3px 10px rgba(0,0,0,0.45);">🏫</div>`,
  iconSize: [46,46], iconAnchor: [23,23],
})

const RADIO_MAXIMO   = 100   // metros — debe estar a menos de 100m para escanear
const LIMIT_CERCANAS = 20

interface Pin { id:string; codigo:string; nombre:string; direccion:string; barrio:string; lat:number; lng:number; vecesEscaneada?:number; fotosUrls?:string[]; categoria?:string }
interface BaldosaCercana { id:string; codigo:string; nombre:string; lat:number; lng:number; direccion:string; barrio:string; mensajeAR:string; distancia?:number; vecesEscaneada?:number; fotosUrls?:string[] }
interface BaldosaRecorrido { id:string; codigo:string; nombre:string; lat:number; lng:number; direccion:string }
interface DatosRecorrido { id:string; nombre:string; direccion:string; barrio:string; lat:number; lng:number; baldosas:BaldosaRecorrido[]; ruta_geojson: any }
interface MapViewProps {
  initialLocation: { lat:number; lng:number };
  recorrido?: DatosRecorrido;
  /** Radio en metros desde la escuela (solo en modo recorrido). Default 500. */
  filtroRadio?: number;
  /** Categorías permitidas (solo en modo recorrido). Si undefined o vacío, todas. */
  filtroCategorias?: string[];
}

function calcularDistancia(lat1:number,lng1:number,lat2:number,lng2:number):number {
  const R=6371e3, ph1=(lat1*Math.PI)/180, ph2=(lat2*Math.PI)/180
  const dp=((lat2-lat1)*Math.PI)/180, dl=((lng2-lng1)*Math.PI)/180
  const a=Math.sin(dp/2)**2+Math.cos(ph1)*Math.cos(ph2)*Math.sin(dl/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

function formatearDistancia(m:number):string {
  return m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(1)} km`
}

/** Normaliza texto para búsqueda: minúsculas y sin acentos */
function normalizar(texto:string):string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
}

function MapFitter({pins, recorrido, filtroRadio}:{pins:Pin[]; recorrido?:DatosRecorrido; filtroRadio?:number}) {
  const map=useMap(), done=useRef(false)
  useEffect(()=>{
    if(done.current) return
    if(recorrido){
      // Modo recorrido: centrar en la escuela con un radio de "filtroRadio" metros
      done.current=true
      const radio = filtroRadio ?? 500
      // Convertir metros a un padding de bounds: aprox 1° lat = 111111m
      const deltaLat = radio / 111111
      const deltaLng = radio / (111111 * Math.cos(recorrido.lat * Math.PI / 180))
      const bounds = L.latLngBounds(
        [recorrido.lat - deltaLat, recorrido.lng - deltaLng],
        [recorrido.lat + deltaLat, recorrido.lng + deltaLng],
      )
      map.fitBounds(bounds, {padding:[40,40], maxZoom:17})
    } else if(pins.length>0){
      done.current=true
      map.fitBounds(L.latLngBounds(pins.map(p=>[p.lat,p.lng] as [number,number])),{padding:[50,50],maxZoom:15})
    }
  },[pins,recorrido,map])
  return null
}

function RouteController({userLocation,destino}:{userLocation:{lat:number;lng:number}|null; destino:{lat:number;lng:number}|null}) {
  const map=useMap()
  useEffect(()=>{
    if(!destino||!userLocation) return
    // Esperar a que el panel se cierre y el DOM se actualice antes de ajustar el mapa
    const timer=setTimeout(()=>{
      map.invalidateSize()
      map.flyToBounds(
        L.latLngBounds([[userLocation.lat,userLocation.lng],[destino.lat,destino.lng]]),
        {padding:[80,80],maxZoom:17,duration:0.6}
      )
    },150)
    return ()=>clearTimeout(timer)
  },[destino,userLocation,map])
  return null
}

/** Vuela el mapa a una coordenada específica */
function FlyTo({target}:{target:{lat:number;lng:number}|null}) {
  const map=useMap()
  useEffect(()=>{
    if(target) map.flyTo([target.lat,target.lng],17,{duration:0.8})
  },[target,map])
  return null
}

// ─── Slider de fotos ─────────────────────────────────────────────────────────

function FotosSlider({ fotos, nombre }: { fotos: string[]; nombre: string }) {
  const [idx, setIdx] = React.useState(0)
  if (fotos.length === 0) return null
  const prev = () => setIdx(i => (i - 1 + fotos.length) % fotos.length)
  const next = () => setIdx(i => (i + 1) % fotos.length)
  return (
    <div style={{position:'relative',marginBottom:'16px',borderRadius:'10px',overflow:'hidden',background:'#000'}}>
      <img
        src={fotos[idx]}
        alt={`${nombre} — foto ${idx + 1}`}
        style={{width:'100%',maxHeight:'240px',objectFit:'cover',display:'block'}}
      />
      {fotos.length > 1 && (
        <>
          <button onClick={prev} style={{position:'absolute',left:'8px',top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.45)',color:'white',border:'none',borderRadius:'50%',width:'32px',height:'32px',fontSize:'1rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
          <button onClick={next} style={{position:'absolute',right:'8px',top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.45)',color:'white',border:'none',borderRadius:'50%',width:'32px',height:'32px',fontSize:'1rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
          <div style={{position:'absolute',bottom:'8px',left:0,right:0,display:'flex',justifyContent:'center',gap:'5px'}}>
            {fotos.map((_,i) => (
              <button key={i} onClick={()=>setIdx(i)} style={{width:'6px',height:'6px',borderRadius:'50%',border:'none',background:i===idx?'white':'rgba(255,255,255,0.45)',padding:0,cursor:'pointer'}}/>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function MapView({
  initialLocation,
  recorrido,
  filtroRadio = 500,
  filtroCategorias,
}: MapViewProps) {
  const [pins,setPins]=useState<Pin[]>([])
  const [loadingPins,setLoadingPins]=useState(true)
  const [userLocation,setUserLocation]=useState<{lat:number;lng:number}|null>(null)
  const [loadingLocation,setLoadingLocation]=useState(true)
  const [panelAbierto,setPanelAbierto]=useState(false)
  const [cercanas,setCercanas]=useState<BaldosaCercana[]>([])
  const [loadingCercanas,setLoadingCercanas]=useState(false)
  const [cargado,setCargado]=useState(false)
  // Resetear caché del panel cuando cambian los filtros (modo escuela)
  useEffect(() => {
    if (!recorrido) return
    setCargado(false)
    setCercanas([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroRadio, filtroCategorias?.join(',')])

  const [destino,setDestino]=useState<BaldosaCercana|null>(null)
  const [detalle,setDetalle]=useState<Pin|BaldosaCercana|null>(null)
  const [loadingDetalle,setLoadingDetalle]=useState(false)
  const recorridoAutoRef = useRef(false)
  const [distanciaDestino,setDistanciaDestino]=useState<number|null>(null)
  const [ruta,setRuta]=useState<[number,number][]>([])
  const [loadingRuta,setLoadingRuta]=useState(false)
  const [pidiendo,setPidiendo]=useState(false)

  // ─── Estado de búsqueda ──────────────────────────────────────────────────
  const [busquedaAbierta,setBusquedaAbierta]=useState(false)
  const [queryBusqueda,setQueryBusqueda]=useState('')
  const [flyTarget,setFlyTarget]=useState<{lat:number;lng:number}|null>(null)
  const inputBusquedaRef=useRef<HTMLInputElement>(null)

  const resultadosBusqueda=useMemo(()=>{
    if(queryBusqueda.trim().length<2) return []
    const q=normalizar(queryBusqueda.trim())
    return pins
      .filter(p=>normalizar(p.nombre).includes(q)||normalizar(p.direccion).includes(q)||normalizar(p.barrio).includes(q))
      .slice(0,12)
  },[queryBusqueda,pins])

  const abrirBusqueda=()=>{
    setBusquedaAbierta(true)
    setTimeout(()=>inputBusquedaRef.current?.focus(),80)
  }
  const cerrarBusqueda=()=>{
    setBusquedaAbierta(false)
    setQueryBusqueda('')
  }
  const seleccionarResultado=(pin:Pin)=>{
    cerrarBusqueda()
    setFlyTarget({lat:pin.lat,lng:pin.lng})
    // Limpiar flyTarget después de volar para que se pueda volver a seleccionar el mismo pin
    setTimeout(()=>setFlyTarget(null),1000)
    verDetalle(pin.id,pin)
  }

  useEffect(()=>{
    if(!navigator.geolocation){setLoadingLocation(false);return}
    const obtenerUbicacion=()=>{
      navigator.geolocation.getCurrentPosition(
        pos=>{setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude});setLoadingLocation(false)},
        ()=>setLoadingLocation(false),
        {enableHighAccuracy:true,timeout:10000}
      )
    }
    if(navigator.permissions){
      navigator.permissions.query({name:'geolocation'}).then(result=>{
        if(result.state==='denied'){
          setLoadingLocation(false)
        } else {
          obtenerUbicacion()
        }
      }).catch(()=>obtenerUbicacion())
    } else {
      obtenerUbicacion()
    }
  },[])

  useEffect(()=>{
    fetch('/api/baldosas/pins').then(r=>r.json()).then(d=>setPins(d.pins||[])).catch(console.error).finally(()=>setLoadingPins(false))
  },[])

  const pedirUbicacion=()=>{
    if(!navigator.geolocation)return
    setPidiendo(true)
    navigator.geolocation.getCurrentPosition(
      pos=>{ setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude}); setLoadingLocation(false); setPidiendo(false) },
      ()=>setPidiendo(false),
      {enableHighAccuracy:true,timeout:10000}
    )
  }
  // Exponer en window para que el popup de Leaflet pueda llamarla (Leaflet bloquea eventos React)
  ;(window as any).__mapPedirUbicacion = pedirUbicacion

  const abrirPanel=()=>{
    setPanelAbierto(true)
    if(cargado)return
    setLoadingCercanas(true); setCargado(true)

    // ── Modo escuela: lista local de baldosas filtradas (idsRecorrido) ──
    if(recorrido){
      // Origen para calcular distancia: ubicación del usuario si está, si no la escuela
      const origen = userLocation ?? { lat: recorrido.lat, lng: recorrido.lng }
      const lista:BaldosaCercana[] = pins
        .filter(p => idsRecorrido.has(p.id))
        .map(p => ({...p, mensajeAR:'', distancia: calcularDistancia(origen.lat, origen.lng, p.lat, p.lng)}))
        .sort((a,b)=>(a.distancia??0)-(b.distancia??0))
      setCercanas(lista)
      setLoadingCercanas(false)
      return
    }

    // ── Modo /mapa general (sin escuela): comportamiento original ──
    if(userLocation){
      const{lat,lng}=userLocation
      fetch(`/api/baldosas/nearby?lat=${lat}&lng=${lng}&radius=5000`).then(r=>r.json()).then(d=>{
        const lista:BaldosaCercana[]=(d.baldosas||[]).slice(0,LIMIT_CERCANAS).map((b:any)=>({...b,distancia:calcularDistancia(lat,lng,b.lat,b.lng)}))
        lista.sort((a,b)=>(a.distancia??0)-(b.distancia??0)); setCercanas(lista)
      }).catch(console.error).finally(()=>setLoadingCercanas(false))
    } else {
      setCercanas(pins.slice(0,LIMIT_CERCANAS).map(p=>({...p,mensajeAR:''}))); setLoadingCercanas(false)
    }
  }

  /**
   * Calcula la ruta peatonal entre dos puntos.
   * Intenta primero OpenRouteService (foot-walking); si falla o no hay key,
   * cae automáticamente a OSRM público. Si ambos fallan, traza línea recta.
   */
  const fetchRuta=async(origen:{lat:number;lng:number},dest:{lat:number;lng:number})=>{
    setLoadingRuta(true)

    // ── 1. OpenRouteService ──────────────────────────────────────────────────
    const orsKey = process.env.NEXT_PUBLIC_ORS_API_KEY
    if (orsKey) {
      try {
        const orsUrl = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${orsKey}&start=${origen.lng},${origen.lat}&end=${dest.lng},${dest.lat}`
        const res = await fetch(orsUrl)
        if (res.status === 429 || res.status === 403) {
          // Límite diario agotado o key inválida → caer a OSRM
          console.warn(`ORS respondió ${res.status}, usando OSRM de respaldo`)
        } else if (res.ok) {
          const data = await res.json()
          const coords = data.features?.[0]?.geometry?.coordinates as [number,number][]|undefined
          if (coords && coords.length > 0) {
            setRuta(coords.map(([lng, lat]) => [lat, lng]))
            setLoadingRuta(false)
            return
          }
        }
      } catch(e) {
        console.warn('ORS falló, usando OSRM de respaldo:', e)
      }
    }

    // ── 2. OSRM público (respaldo) ───────────────────────────────────────────
    try {
      const osrmUrl=`https://router.project-osrm.org/route/v1/foot/${origen.lng},${origen.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      const res=await fetch(osrmUrl)
      const data=await res.json()
      if(data.routes&&data.routes[0]){
        const coords:[number,number][]=data.routes[0].geometry.coordinates.map(([lng,lat]:[number,number])=>[lat,lng])
        setRuta(coords)
        setLoadingRuta(false)
        return
      }
    } catch(e) {
      console.warn('OSRM también falló:', e)
    }

    // ── 3. Línea recta como último recurso ───────────────────────────────────
    if(userLocation) setRuta([[userLocation.lat,userLocation.lng],[dest.lat,dest.lng]])
    setLoadingRuta(false)
  }

  /** @deprecated usar fetchRuta — se mantiene como alias para compatibilidad */
  const fetchRutaOSRM = fetchRuta

  const verDetalle=async(id:string,datosBasicos:Pin|BaldosaCercana)=>{
    setDetalle(datosBasicos)
    setLoadingDetalle(true)
    try {
      const res=await fetch(`/api/baldosas/${id}`)
      const data=await res.json()
      if(data.baldosa) setDetalle(data.baldosa)
    } catch(e) { console.error('Error detalle:',e) }
    finally { setLoadingDetalle(false) }
  }

  const prefetchAFrame = () => {
    if (document.getElementById('aframe-prefetch')) return
    const link = document.createElement('link')
    link.id   = 'aframe-prefetch'
    link.rel  = 'prefetch'
    link.href = 'https://aframe.io/releases/1.4.1/aframe.min.js'
    document.head.appendChild(link)
  }

  const iniciarRecorrido=(b:BaldosaCercana)=>{
    if(destino?.id===b.id){ setDestino(null); setRuta([]); setDistanciaDestino(null); return }
    setDestino(b); setRuta([]); setPanelAbierto(false)
    prefetchAFrame()
    if(userLocation){
      setDistanciaDestino(calcularDistancia(userLocation.lat,userLocation.lng,b.lat,b.lng))
      fetchRutaOSRM(userLocation,{lat:b.lat,lng:b.lng})
    }
  }

  useEffect(()=>{
    if(recorridoAutoRef.current||!userLocation||pins.length===0)return
    recorridoAutoRef.current=true
    // Si hay recorrido escolar, restringir a sus baldosas; si no, todas
    const candidatas = recorrido
      ? pins.filter(p => idsRecorrido.has(p.id))
      : pins
    if(candidatas.length===0) return
    let minDist=Infinity, masCercana:Pin|null=null
    for(const p of candidatas){
      const d=calcularDistancia(userLocation.lat,userLocation.lng,p.lat,p.lng)
      if(d<minDist){minDist=d;masCercana=p}
    }
    if(masCercana) iniciarRecorrido({...masCercana,mensajeAR:'',distancia:minDist})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[userLocation,pins])

  useEffect(()=>{
    if(!userLocation||!destino)return
    setDistanciaDestino(calcularDistancia(userLocation.lat,userLocation.lng,destino.lat,destino.lng))
  },[userLocation,destino])



  // ruta viene de fetchRuta (ORS con fallback OSRM — se actualiza en iniciarRecorrido)

  // Medir alto real del banner de recorrido para posicionar botones debajo
  const bannerRef = useRef<HTMLDivElement>(null)
  const [bannerHeight, setBannerHeight] = useState(0)

  useEffect(() => {
    const el = bannerRef.current
    if (!el) { setBannerHeight(0); return }
    const ro = new ResizeObserver(([entry]) => setBannerHeight(entry.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [destino])

  const topBotones = destino ? `${bannerHeight + 10}px` : '12px'

  // ─── Estado del recorrido escolar ────────────────────────────────────────
  // Persiste en localStorage bajo la key `recorrido:${escuelaId}`.
  // Estructura: { iniciado: number(timestamp ms), marcadas: string[] }
  const STORAGE_KEY = recorrido ? `recorrido:${recorrido.id}` : null
  const PENDING_KEY = recorrido ? `recorrido_pending:${recorrido.id}` : null

  const [recorridoIniciado, setRecorridoIniciado] = useState(false)
  const [baldosasMarcadas, setBaldosasMarcadas]   = useState<Set<string>>(new Set())
  const [mostrarCertificado, setMostrarCertificado] = useState(false)
  const [mostrarPanelProgreso, setMostrarPanelProgreso] = useState(false)
  const yaMostroCertificadoRef = useRef(false)

  // Cargar estado guardado + procesar pending al montar
  useEffect(() => {
    if (!STORAGE_KEY || !recorrido) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const guardado = raw ? JSON.parse(raw) : null
      let marcadasIniciales: string[] = guardado?.marcadas ?? []
      const iniciado = Boolean(guardado?.iniciado)

      // Procesar baldosa pendiente (si volvió del scanner)
      if (PENDING_KEY) {
        const pending = localStorage.getItem(PENDING_KEY)
        if (pending && recorrido.baldosas.some(b => b.id === pending)) {
          if (!marcadasIniciales.includes(pending)) {
            marcadasIniciales = [...marcadasIniciales, pending]
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              iniciado: guardado?.iniciado ?? Date.now(),
              marcadas: marcadasIniciales,
            }))
          }
          localStorage.removeItem(PENDING_KEY)
        }
      }

      if (iniciado) setRecorridoIniciado(true)
      if (marcadasIniciales.length > 0) setBaldosasMarcadas(new Set(marcadasIniciales))
    } catch (e) {
      console.error('Error leyendo estado de recorrido:', e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorrido?.id])

  const comenzarRecorrido = () => {
    if (!STORAGE_KEY) return
    setRecorridoIniciado(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      iniciado: Date.now(),
      marcadas: Array.from(baldosasMarcadas),
    }))
  }

  const reiniciarRecorrido = () => {
    if (!STORAGE_KEY) return
    if (!confirm('¿Reiniciar el recorrido? Vas a perder el progreso guardado.')) return
    localStorage.removeItem(STORAGE_KEY)
    if (PENDING_KEY) localStorage.removeItem(PENDING_KEY)
    setRecorridoIniciado(false)
    setBaldosasMarcadas(new Set())
    setMostrarPanelProgreso(false)
    yaMostroCertificadoRef.current = false
  }

  /** Guarda que el usuario está yendo a escanear una baldosa del recorrido,
   *  para que al volver del scanner la marque automáticamente. */
  const prepararEscaneoRecorrido = (baldosaId: string) => {
    if (!PENDING_KEY || !recorridoIniciado) return
    if (!recorrido?.baldosas.some(b => b.id === baldosaId)) return
    localStorage.setItem(PENDING_KEY, baldosaId)
  }

  const descargarCertificado = async () => {
    if (!recorrido) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      // A4 landscape: 297 x 210 mm
      const W = 297, H = 210, CX = W / 2

      // Borde decorativo doble
      doc.setDrawColor(26, 42, 58)
      doc.setLineWidth(1.2)
      doc.rect(12, 12, W - 24, H - 24)
      doc.setLineWidth(0.3)
      doc.rect(16, 16, W - 32, H - 32)

      // Eyebrow
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(74, 107, 124)
      doc.text('RECORREMOS MEMORIA', CX, 38, { align: 'center', charSpace: 1.2 })

      // Título
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(34)
      doc.setTextColor(26, 42, 58)
      doc.text('Recorrido completado', CX, 56, { align: 'center' })

      // Línea separadora
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(0.6)
      doc.line(CX - 30, 66, CX + 30, 66)

      // "Se certifica que..."
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(14)
      doc.setTextColor(45, 74, 94)
      doc.text('Se certifica que', CX, 84, { align: 'center' })

      // Nombre de la escuela
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(26, 42, 58)
      const nombreLineas = doc.splitTextToSize(recorrido.nombre, 240)
      doc.text(nombreLineas, CX, 100, { align: 'center' })

      // Cuerpo
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(13)
      doc.setTextColor(45, 74, 94)
      const total = recorrido.baldosas.length
      const cuerpo =
        `completó el recorrido por la memoria visitando las ${total} ` +
        `baldosa${total !== 1 ? 's' : ''} que homenajean a víctimas del ` +
        `terrorismo de Estado en su barrio.`
      const cuerpoLineas = doc.splitTextToSize(cuerpo, 220)
      doc.text(cuerpoLineas, CX, 130, { align: 'center' })

      // Fecha
      const fecha = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
      doc.setFontSize(12)
      doc.setTextColor(74, 107, 124)
      doc.text(`Ciudad Autónoma de Buenos Aires, ${fecha}`, CX, 165, { align: 'center' })

      // Pie
      doc.setFontSize(9)
      doc.setTextColor(120, 134, 148)
      doc.text('recorremosmemoria · proyecto colaborativo', CX, 185, { align: 'center' })

      const safeName = recorrido.nombre
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
      doc.save(`certificado-${safeName || 'recorrido'}.pdf`)
    } catch (e) {
      console.error('Error generando certificado:', e)
      alert('No se pudo generar el certificado. Probá de nuevo.')
    }
  }

  // ─── Datos derivados del recorrido escolar ───────────────────────────────
  // ─── Baldosas del recorrido escolar (filtradas por radio + categorías) ──
  // Antes venían curadas en recorrido.baldosas. Ahora se calculan en cliente.
  const idsRecorrido = useMemo(() => {
    if (!recorrido) return new Set<string>()
    const set = new Set<string>()
    for (const p of pins) {
      // Filtro de distancia desde la escuela (haversine, línea recta)
      const dist = calcularDistancia(recorrido.lat, recorrido.lng, p.lat, p.lng)
      if (dist > filtroRadio) continue
      // Filtro de categorías (si está definido y tiene items)
      // Si el pin no trae categoría, se lo deja pasar para no romper el filtro.
      if (filtroCategorias && filtroCategorias.length > 0 && p.categoria) {
        if (!filtroCategorias.includes(p.categoria)) continue
      }
      set.add(p.id)
    }
    return set
  }, [recorrido, pins, filtroRadio, filtroCategorias])
  const totalRecorrido = idsRecorrido.size
  const marcadasCount = baldosasMarcadas.size
  const recorridoCompletado = recorridoIniciado && totalRecorrido > 0 && marcadasCount >= totalRecorrido

  // Mostrar modal de certificado una sola vez cuando se completa el recorrido
  useEffect(() => {
    if (recorridoCompletado && !yaMostroCertificadoRef.current) {
      yaMostroCertificadoRef.current = true
      setMostrarCertificado(true)
    }
  }, [recorridoCompletado])

  return (
    <div style={{position:'relative',width:'100%',height:'100%'}}>

      <MapContainer center={[userLocation?.lat??initialLocation.lat,userLocation?.lng??initialLocation.lng]} zoom={13} style={{width:'100%',height:'100%'}} zoomControl={false}>
        <TileLayer attribution='&copy; <a href="https://www.ign.gob.ar/AreaServicios/Argenmap/IntroduccionV2" target="_blank">Instituto Geográfico Nacional</a> + <a href="https://www.osm.org/copyright" target="_blank">OpenStreetMap</a>' url="https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG:3857@png/{z}/{x}/{-y}.png"/>
        {ruta.length>1&&<Polyline positions={ruta} pathOptions={{color:'#2563eb',weight:5,opacity:0.9}}/>}
        {/* Marcador de la escuela */}
        {recorrido&&(
          <Marker position={[recorrido.lat,recorrido.lng]} icon={escuelaIcon}>
            <Popup>
              <div style={{fontFamily:'sans-serif',minWidth:'160px'}}>
                <strong style={{fontSize:'0.9rem'}}>{recorrido.nombre}</strong>
                <p style={{fontSize:'0.78rem',color:'#4a6b7c',margin:'4px 0 0'}}>{recorrido.direccion}</p>
              </div>
            </Popup>
          </Marker>
        )}
        {userLocation&&<Marker position={[userLocation.lat,userLocation.lng]} icon={userIcon}><Popup><div style={{fontFamily:'sans-serif',textAlign:'center'}}><strong>Tu ubicación</strong></div></Popup></Marker>}
        {pins.map(pin=>{
          const dist=userLocation?calcularDistancia(userLocation.lat,userLocation.lng,pin.lat,pin.lng):null
          const cerca=dist!==null&&dist<=RADIO_MAXIMO
          const esDestino=destino?.id===pin.id
          return(
            <Marker key={pin.id} position={[pin.lat,pin.lng]} icon={esDestino?destinoIcon:idsRecorrido.has(pin.id)?(baldosasMarcadas.has(pin.id)?recorridoMarcadaIcon:recorridoIcon):baldosaIcon}>
              <Popup>
                <div style={{fontFamily:'sans-serif',minWidth:'200px',maxWidth:'240px'}}>
                  <h3 style={{fontSize:'0.95rem',color:'#1a2a3a',margin:'0 0 4px'}}>{pin.nombre}</h3>
                  {pin.direccion&&<p style={{fontSize:'0.78rem',color:'#4a6b7c',margin:'0 0 4px'}}>{pin.direccion}</p>}
                  {dist!==null&&<p style={{fontSize:'0.78rem',fontWeight:600,color:cerca?'#166534':'#4b5563',margin:'0 0 4px'}}>{cerca?`✓ Estás cerca · ${formatearDistancia(dist)}`:`Estás a ${formatearDistancia(dist)}`}</p>}
                  {pin.vecesEscaneada!==undefined&&pin.vecesEscaneada>0&&<p style={{fontSize:'0.82rem',fontWeight:600,color:'#2563eb',margin:'0 0 8px'}}>👁 {pin.vecesEscaneada.toLocaleString('es-AR')} {pin.vecesEscaneada===1?'visita':'visitas'}</p>}
                  <div style={{display:'flex',gap:'6px',marginTop:'6px'}}>
                    <button onClick={()=>verDetalle(pin.id,pin)} style={{flex:1,padding:'7px',background:'#2563eb',color:'white',border:'none',borderRadius:'6px',fontSize:'0.82rem',fontWeight:600,cursor:'pointer'}}>Ver detalle</button>
                    {userLocation
                      ? esDestino
                        ? <button onClick={()=>{setDestino(null);setRuta([]);setDistanciaDestino(null)}} style={{flex:1,padding:'7px',background:'#fee2e2',color:'#dc2626',border:'1px solid #fecaca',borderRadius:'6px',fontSize:'0.78rem',fontWeight:600,cursor:'pointer'}}>Ir a otra</button>
                        : <button onClick={()=>iniciarRecorrido({...pin,mensajeAR:''})} style={{flex:1,padding:'7px',background:'#f0f4f8',color:'#1a2a3a',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'0.82rem',fontWeight:600,cursor:'pointer'}}>Ir →</button>
                      :<button onMouseDown={e=>{e.stopPropagation();(window as any).__mapPedirUbicacion?.()}} style={{flex:1,padding:'7px',background:'#1a2a3a',color:'white',border:'none',borderRadius:'6px',fontSize:'0.75rem',fontWeight:600,cursor:'pointer'}}>Activar GPS</button>
                    }
                  </div>
                  {/* Botón escanear en popup — activo solo si estás cerca */}
                  <a
                    href={cerca ? '/scanner' : undefined}
                    onClick={cerca ? () => prepararEscaneoRecorrido(pin.id) : e=>e.preventDefault()}
                    style={{
                      display:'block',
                      marginTop:'6px',
                      padding:'7px',
                      background:cerca?'#1d4ed8':'#e5e7eb',
                      color:cerca?'white':'#9ca3af',
                      borderRadius:'6px',
                      fontSize:'0.82rem',
                      fontWeight:600,
                      textAlign:'center',
                      textDecoration:'none',
                      cursor:cerca?'pointer':'not-allowed',
                      opacity:cerca?1:0.7,
                    }}
                  >
                    📸 {cerca?'Escanear baldosa':'Acercate para escanear'}
                  </a>
                  <a
                    href={`/colaborar/${pin.id}`}
                    style={{
                      display:'block',
                      marginTop:'6px',
                      padding:'5px',
                      fontSize:'0.75rem',
                      color:'#6b7280',
                      textAlign:'right',
                      textDecoration:'none',
                    }}
                  >
                    ¿Corregir datos?
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
        <MapFitter pins={pins} recorrido={recorrido} filtroRadio={filtroRadio}/>
        <RouteController userLocation={userLocation} destino={destino}/>
        <FlyTo target={flyTarget}/>
      </MapContainer>

      {/* ── Botones flotantes: Inicio (izq) + Buscar (der) ─────────── */}
      {!busquedaAbierta ? (
        <>
          <a
            href={recorrido ? "/recorridos/escuela" : "/"}
            aria-label={recorrido ? "Volver a Escuelas" : "Volver al inicio"}
            style={{
              position:'absolute',
              top:topBotones,
              left:'12px',
              zIndex:450,
              height:'42px',
              borderRadius:'21px',
              background:'white',
              boxShadow:'0 2px 12px rgba(0,0,0,0.25)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:'6px',
              padding:'0 14px',
              textDecoration:'none',
              color:'#1a2a3a',
              transition:'top 0.25s ease',
            }}
          >
            <img src="/images/logo_flores.png" alt="Inicio" style={{width:'24px',height:'24px',objectFit:'contain'}}/>
            <span style={{fontSize:'0.88rem',fontWeight:600}}>{recorrido ? 'Escuelas' : 'Volver'}</span>
          </a>
          {recorrido ? (
            // ── Modo recorrido escolar: botón "Comenzar" o chip contador ──
            !recorridoIniciado ? (
              <button
                onClick={comenzarRecorrido}
                aria-label="Comenzar recorrido"
                style={{
                  position:'absolute',
                  top:topBotones,
                  right:'12px',
                  zIndex:450,
                  height:'42px',
                  borderRadius:'21px',
                  border:'none',
                  background:'#c0392b',
                  boxShadow:'0 2px 12px rgba(192,57,43,0.45)',
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:'6px',
                  padding:'0 16px',
                  color:'white',
                  fontFamily:'inherit',
                  transition:'top 0.25s ease',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <span style={{fontSize:'0.88rem',fontWeight:700,letterSpacing:'0.01em'}}>Comenzar recorrido</span>
              </button>
            ) : (
              <button
                onClick={() => setMostrarPanelProgreso(true)}
                aria-label={`${marcadasCount} de ${totalRecorrido} baldosas marcadas — ver progreso`}
                title="Ver progreso del recorrido"
                style={{
                  position:'absolute',
                  top:topBotones,
                  right:'12px',
                  zIndex:450,
                  height:'42px',
                  borderRadius:'21px',
                  border:'none',
                  background:recorridoCompletado ? '#16a34a' : 'white',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.25)',
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:'8px',
                  padding:'0 16px',
                  color:recorridoCompletado ? 'white' : '#1a2a3a',
                  fontFamily:'inherit',
                  transition:'top 0.25s ease, background 0.3s',
                }}
              >
                {recorridoCompletado
                  ? <span style={{fontSize:'1rem'}}>🎉</span>
                  : <img src="/images/logo_flores_fondo_azul.png" alt="" style={{width:'22px',height:'22px',objectFit:'contain',flexShrink:0}}/>
                }
                <span style={{fontSize:'0.95rem',fontWeight:700,letterSpacing:'0.01em'}}>
                  {marcadasCount} / {totalRecorrido}
                </span>
              </button>
            )
          ) : (
            <button
              onClick={abrirBusqueda}
              aria-label="Buscar baldosa"
              style={{
                position:'absolute',
                top:topBotones,
                right:'12px',
                zIndex:450,
                height:'42px',
                borderRadius:'21px',
                border:'none',
                background:'white',
                boxShadow:'0 2px 12px rgba(0,0,0,0.25)',
                cursor:'pointer',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:'6px',
                padding:'0 16px',
                color:'#1a2a3a',
                transition:'top 0.25s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8.5" cy="8.5" r="6"/>
                <line x1="13" y1="13" x2="18" y2="18"/>
              </svg>
              <span style={{fontSize:'0.88rem',fontWeight:600}}>Buscar</span>
            </button>
          )}
        </>
      ) : (
        <div style={{
          position:'absolute',
          top:topBotones,
          left:'12px',
          right:'12px',
          zIndex:450,
          maxWidth:'480px',
          marginLeft:'auto',
          marginRight:'auto',
          transition:'top 0.25s ease',
        }}>
          {/* Barra de búsqueda */}
          <div style={{
            display:'flex',
            alignItems:'center',
            background:'white',
            borderRadius: resultadosBusqueda.length>0 ? '14px 14px 0 0' : '14px',
            boxShadow:'0 4px 24px rgba(0,0,0,0.2)',
            padding:'0 4px 0 14px',
            height:'48px',
            gap:'8px',
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <circle cx="8.5" cy="8.5" r="6"/>
              <line x1="13" y1="13" x2="18" y2="18"/>
            </svg>
            <input
              ref={inputBusquedaRef}
              type="text"
              value={queryBusqueda}
              onChange={e=>setQueryBusqueda(e.target.value)}
              placeholder="Buscar por nombre o dirección…"
              style={{
                flex:1,
                border:'none',
                outline:'none',
                fontSize:'0.92rem',
                color:'#1a2a3a',
                background:'transparent',
                padding:'0',
              }}
            />
            {queryBusqueda && (
              <button
                onClick={()=>setQueryBusqueda('')}
                style={{background:'none',border:'none',color:'#9ca3af',fontSize:'1.1rem',cursor:'pointer',padding:'4px',lineHeight:1}}
              >
                ✕
              </button>
            )}
            <button
              onClick={cerrarBusqueda}
              style={{
                background:'#f3f4f6',
                border:'none',
                borderRadius:'10px',
                padding:'6px 12px',
                fontSize:'0.82rem',
                fontWeight:600,
                color:'#4a6b7c',
                cursor:'pointer',
                whiteSpace:'nowrap',
              }}
            >
              Cerrar
            </button>
          </div>

          {/* Resultados */}
          {queryBusqueda.trim().length >= 2 && (
            <div style={{
              background:'white',
              borderRadius:'0 0 14px 14px',
              boxShadow:'0 8px 24px rgba(0,0,0,0.15)',
              maxHeight:'55vh',
              overflowY:'auto',
              borderTop:'1px solid #f0f0f0',
            }}>
              {resultadosBusqueda.length === 0 ? (
                <p style={{padding:'16px',textAlign:'center',color:'#6b7280',fontSize:'0.85rem',margin:0}}>
                  No se encontraron baldosas
                </p>
              ) : (
                resultadosBusqueda.map(pin => {
                  const dist = userLocation ? calcularDistancia(userLocation.lat, userLocation.lng, pin.lat, pin.lng) : null
                  return (
                    <button
                      key={pin.id}
                      onClick={() => seleccionarResultado(pin)}
                      style={{
                        display:'flex',
                        alignItems:'center',
                        gap:'10px',
                        width:'100%',
                        padding:'12px 14px',
                        background:'transparent',
                        border:'none',
                        borderBottom:'1px solid #f5f5f5',
                        cursor:'pointer',
                        textAlign:'left',
                      }}
                    >
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{fontSize:'0.9rem',fontWeight:600,color:'#1a2a3a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {pin.nombre}
                        </p>
                        <p style={{fontSize:'0.76rem',color:'#6b7280',margin:'1px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {pin.direccion}{pin.barrio ? ` · ${pin.barrio}` : ''}
                        </p>
                      </div>
                      {dist !== null && (
                        <span style={{fontSize:'0.72rem',fontWeight:600,color:'#6b7280',flexShrink:0}}>
                          {formatearDistancia(dist)}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Banner recorrido activo */}
      {destino&&(
        <div ref={bannerRef} style={{position:'absolute',top:0,left:0,right:0,zIndex:400}}>
          {/* Fila de info del recorrido */}
          <div style={{background:'#2563eb',color:'white',padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'0.85rem',fontWeight:500}}>
            <span>→ {destino.nombre}{distanciaDestino!==null?` · ${formatearDistancia(distanciaDestino)}`:''}</span>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              {loadingRuta&&<span style={{fontSize:'0.75rem',opacity:0.8}}>Calculando…</span>}
              <button onClick={()=>{setDestino(null);setRuta([]);setDistanciaDestino(null)}} style={{background:'transparent',border:'none',color:'rgba(255,255,255,0.7)',fontSize:'1.1rem',cursor:'pointer'}}>✕</button>
            </div>
          </div>
          {/* Botón escanear — aparece solo cuando llegás (≤ 30m) */}
          {distanciaDestino!==null&&distanciaDestino<=30&&(
            <div style={{background:'#1d4ed8',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <span style={{fontSize:'1.2rem'}}>📍</span>
                <div>
                  <p style={{color:'white',fontWeight:700,fontSize:'0.9rem',margin:0}}>¡Llegaste!</p>
                  <p style={{color:'rgba(255,255,255,0.75)',fontSize:'0.75rem',margin:0}}>Estás a {Math.round(distanciaDestino)} m de la baldosa</p>
                </div>
              </div>
              <a
                href="/scanner"
                onClick={() => { if (destino) prepararEscaneoRecorrido(destino.id) }}
                style={{
                  background:'white',
                  color:'#1d4ed8',
                  border:'none',
                  borderRadius:'10px',
                  padding:'10px 16px',
                  fontSize:'0.9rem',
                  fontWeight:700,
                  cursor:'pointer',
                  textDecoration:'none',
                  whiteSpace:'nowrap',
                  display:'flex',
                  alignItems:'center',
                  gap:'6px',
                  flexShrink:0,
                }}
              >
                📸 Escanear
              </a>
            </div>
          )}
        </div>
      )}

      {/* Botón abrir panel — siempre, también en modo recorrido escolar */}
      {!panelAbierto&&(
        <button onClick={abrirPanel} style={{
          position:'absolute',
          bottom:'calc(env(safe-area-inset-bottom, 0px) + 1.2rem)',
          left:'1rem', right:'1rem',
          zIndex:400,
          background:'#1a2a3a', color:'white', border:'none',
          borderRadius:'16px',
          padding:'1.1rem 1rem',
          fontSize:'1.1rem', fontWeight:700, letterSpacing:'0.01em',
          cursor:'pointer',
          boxShadow:'0 6px 24px rgba(0,0,0,0.35)',
          textAlign:'center',
          width:'calc(100% - 2rem)',
          maxWidth:'480px',
          marginLeft:'auto', marginRight:'auto',
          display:'block',
        }}>
          Ver baldosas cercanas
        </button>
      )}

      {/* Botón escanear — rectangular, mismo estilo que "Ver baldosas cercanas" */}
      {!panelAbierto&&(()=>{
        const enRango = distanciaDestino !== null && distanciaDestino <= RADIO_MAXIMO
        return (
          <a
            href={enRango ? '/scanner' : undefined}
            onClick={enRango
              ? () => { if (destino) prepararEscaneoRecorrido(destino.id) }
              : e => e.preventDefault()}
            style={{
              position: 'absolute',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)',
              left: '1rem', right: '1rem',
              zIndex: 401,
              background: enRango ? '#1d4ed8' : '#1a2a3a',
              color: enRango ? 'white' : 'rgba(255,255,255,0.35)',
              border: 'none',
              borderRadius: '16px',
              padding: '1.1rem 1rem',
              fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.01em',
              cursor: enRango ? 'pointer' : 'not-allowed',
              boxShadow: enRango ? '0 6px 24px rgba(29,78,216,0.45)' : '0 6px 24px rgba(0,0,0,0.35)',
              textAlign: 'center',
              width: 'calc(100% - 2rem)',
              maxWidth: '480px',
              marginLeft: 'auto', marginRight: 'auto',
              display: 'block',
              textDecoration: 'none',
              opacity: enRango ? 1 : 0.6,
              transition: 'background 0.3s, box-shadow 0.3s, opacity 0.3s',
            }}
          >
            📸 {enRango ? 'Escanear baldosa' : 'Acercate para escanear'}
          </a>
        )
      })()}

      {/* Panel inferior */}
      {panelAbierto&&(
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:400,background:'white',borderRadius:'20px 20px 0 0',boxShadow:'0 -6px 32px rgba(0,0,0,0.18)',maxHeight:'45vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* Header */}
          <div style={{flexShrink:0,padding:'12px 16px 10px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'flex-start',justifyContent:'space-between',background:'white',borderRadius:'20px 20px 0 0'}}>
            <div>
              <div style={{width:'40px',height:'4px',background:'#e5e7eb',borderRadius:'2px',margin:'0 auto 8px'}}/>
              <p style={{fontSize:'1rem',fontWeight:700,color:'#1a2a3a',margin:0}}>
                {recorrido
                  ? `${cercanas.length} baldosa${cercanas.length !== 1 ? 's' : ''}${userLocation ? ' (más cercana primero)' : ''}`
                  : userLocation
                    ? `${cercanas.length} baldosa${cercanas.length !== 1 ? 's' : ''} más cercana${cercanas.length !== 1 ? 's' : ''}`
                    : `Primeras ${cercanas.length} baldosa${cercanas.length !== 1 ? 's' : ''}`}
              </p>
              {!userLocation&&!loadingLocation&&<p style={{fontSize:'0.75rem',color:'#6b7280',margin:'2px 0 0'}}>Activá el GPS para ordenar por distancia</p>}
            </div>
            <button onClick={()=>setPanelAbierto(false)} style={{background:'#f3f4f6',border:'none',borderRadius:'50%',width:'30px',height:'30px',cursor:'pointer',color:'#6b7280',fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
          </div>
          {/* Lista scrollable */}
          <div style={{overflowY:'auto',padding:'10px 14px 20px',flex:1}}>
            {loadingCercanas?(
              <div style={{textAlign:'center',padding:'20px 0',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                <div className="loading" style={{width:'18px',height:'18px'}}/>
                <span style={{fontSize:'0.85rem',color:'#4a6b7c'}}>Buscando cercanas…</span>
              </div>
            ):cercanas.length===0?(
              <p style={{textAlign:'center',color:'#6b7280',fontSize:'0.85rem',padding:'16px 0'}}>No se encontraron baldosas en el área</p>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {cercanas.map(b=>{
                  const cerca=b.distancia!==undefined&&b.distancia<=RADIO_MAXIMO
                  const activa=destino?.id===b.id
                  return(
                    <div key={b.id} style={{padding:'11px 12px',border:activa?'2px solid #2563eb':'1px solid #e5e7eb',borderRadius:'10px',background:activa?'rgba(37,99,235,0.05)':'white',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px'}}>
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{fontSize:'0.92rem',fontWeight:600,color:'#1a2a3a',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.nombre}</p>
                        {b.direccion&&<p style={{fontSize:'0.76rem',color:'#6b7280',margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.direccion}{b.barrio?` · ${b.barrio}`:''}</p>}
                        {b.vecesEscaneada!==undefined&&b.vecesEscaneada>0&&(
                          <p style={{fontSize:'0.72rem',color:'#60a5fa',margin:'2px 0 0'}}>
                            👁 {b.vecesEscaneada.toLocaleString('es-AR')} {b.vecesEscaneada===1?'escaneo':'escaneos'}
                          </p>
                        )}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
                        {b.distancia!==undefined&&(
                          <span style={{fontSize:'0.75rem',fontWeight:600,padding:'3px 8px',borderRadius:'12px',background:cerca?'#dcfce7':'#f3f4f6',color:cerca?'#166534':'#6b7280'}}>
                            {cerca?`✓ Cerca · ${formatearDistancia(b.distancia)}`:formatearDistancia(b.distancia)}
                          </span>
                        )}
                        <button onClick={()=>verDetalle(b.id,b)} style={{background:'#f0f4f8',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'5px 8px',fontSize:'0.78rem',fontWeight:600,color:'#1a2a3a',cursor:'pointer',whiteSpace:'nowrap'}}>
                          Ver
                        </button>
                        <button onClick={()=>iniciarRecorrido(b)} style={{background:activa?'#fee2e2':'#eff6ff',border:activa?'1px solid #fecaca':'none',borderRadius:'8px',padding:'5px 10px',fontSize:'0.78rem',fontWeight:600,color:activa?'#dc2626':'#2563eb',cursor:'pointer',whiteSpace:'nowrap',opacity:loadingRuta&&!activa?0.6:1}}>
                          {activa?'Ir a otra':'Ir →'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Panel de detalle de baldosa ──────────────────────────────── */}
      {detalle&&(
        <div style={{position:'absolute',inset:0,zIndex:500,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setDetalle(null)}>
          <style>{`@media(min-width:768px){.detalle-panel{border-radius:16px!important;margin-bottom:2rem!important}}`}</style>
          <div className="detalle-panel" onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:'520px',background:'white',borderRadius:'20px 20px 0 0',boxShadow:'0 -8px 40px rgba(0,0,0,0.2)',maxHeight:'82vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Header */}
            <div style={{flexShrink:0,padding:'16px 20px 12px',borderBottom:'1px solid #f0f0f0',position:'relative'}}>
              <div style={{width:'40px',height:'4px',background:'#e5e7eb',borderRadius:'2px',margin:'0 auto 12px'}}/>
              <button onClick={()=>setDetalle(null)} style={{position:'absolute',top:'16px',right:'16px',background:'#f3f4f6',border:'none',borderRadius:'50%',width:'32px',height:'32px',cursor:'pointer',color:'#6b7280',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              <h2 style={{fontSize:'1.2rem',fontWeight:700,color:'#1a2a3a',margin:0,paddingRight:'40px'}}>
                {'nombre' in detalle ? detalle.nombre : ''}
              </h2>
              {('direccion' in detalle && detalle.direccion)&&(
                <p style={{fontSize:'0.85rem',color:'#4a6b7c',margin:'4px 0 0'}}>
                  {detalle.direccion}{'barrio' in detalle && detalle.barrio ? ` · ${detalle.barrio}` : ''}
                </p>
              )}
            </div>
            {/* Contenido scrollable */}
            <div style={{overflowY:'auto',padding:'16px 20px 32px',flex:1}}>
              {loadingDetalle?(
                <div style={{textAlign:'center',padding:'24px 0',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                  <div className="loading" style={{width:'20px',height:'20px'}}/>
                  <span style={{color:'#4a6b7c',fontSize:'0.9rem'}}>Cargando información…</span>
                </div>
              ):(
                <>
                  {/* Slider de fotos */}
                  {('fotosUrls' in detalle && (detalle as any).fotosUrls?.length > 0)&&(
                    <FotosSlider fotos={(detalle as any).fotosUrls} nombre={'nombre' in detalle ? detalle.nombre : ''} />
                  )}

                  {/* Descripción */}
                  {('descripcion' in detalle && (detalle as any).descripcion)&&(
                    <p style={{fontSize:'0.95rem',color:'#374151',lineHeight:1.6,marginBottom:'14px'}}>
                      {(detalle as any).descripcion}
                    </p>
                  )}
                  {/* Info extendida — sin líneas de "Fecha registrada:" */}
                  {('infoExtendida' in detalle && (detalle as any).infoExtendida)&&(
                    <div style={{background:'#f8fafc',borderRadius:'10px',padding:'12px 14px',marginBottom:'14px'}}>
                      <p style={{fontSize:'0.88rem',color:'#4a6b7c',lineHeight:1.65,margin:0}}>
                        {(detalle as any).infoExtendida
                          .split('\n')
                          .filter((l:string)=>!l.trim().startsWith('Fecha registrada'))
                          .join('\n')}
                      </p>
                    </div>
                  )}
                  {/* Veces escaneada */}
                  {('vecesEscaneada' in detalle && (detalle as any).vecesEscaneada > 0)&&(
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'12px',marginBottom:0}}>
                      <span style={{fontSize:'1.4rem'}}>👁</span>
                      <div>
                        <span style={{fontSize:'1.3rem',fontWeight:700,color:'#2563eb',lineHeight:1}}>
                          {(detalle as any).vecesEscaneada.toLocaleString('es-AR')}
                        </span>
                        <span style={{fontSize:'0.85rem',color:'#60a5fa',marginLeft:'6px'}}>
                          {(detalle as any).vecesEscaneada === 1 ? 'visita en AR' : 'visitas en AR'}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Botón recorrido */}
                  {userLocation?(
                    <button
                      onClick={()=>{
                        const b={...detalle,mensajeAR:('mensajeAR' in detalle?detalle.mensajeAR:'')} as BaldosaCercana
                        iniciarRecorrido(b); setDetalle(null)
                      }}
                      style={{width:'100%',marginTop:'16px',padding:'12px',background:'#1a2a3a',color:'white',border:'none',borderRadius:'12px',fontSize:'1rem',fontWeight:700,cursor:'pointer'}}
                    >
                      Cómo llegar
                    </button>
                  ):(
                    <button
                      onClick={pedirUbicacion}
                      disabled={pidiendo}
                      style={{marginTop:'14px',padding:'7px 14px',background:'transparent',color:pidiendo?'#9ca3af':'#4a6b7c',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'0.8rem',cursor:pidiendo?'default':'pointer',display:'block'}}
                    >
                      {pidiendo?'Obteniendo ubicación…':'Activar ubicación para ir'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Panel de progreso del recorrido ─────────────────────── */}
      {mostrarPanelProgreso && recorrido && (
        <div
          style={{
            position:'absolute', inset:0, zIndex:550,
            background:'rgba(10,18,28,0.6)',
            backdropFilter:'blur(3px)',
            display:'flex', alignItems:'flex-end', justifyContent:'center',
            fontFamily:'sans-serif',
          }}
          onClick={() => setMostrarPanelProgreso(false)}
        >
          <style>{`@media(min-width:768px){.progreso-panel{border-radius:16px!important;margin-bottom:2rem!important;max-height:80vh!important}}`}</style>
          <div
            className="progreso-panel"
            onClick={e => e.stopPropagation()}
            style={{
              width:'100%',
              maxWidth:'480px',
              background:'white',
              borderRadius:'20px 20px 0 0',
              boxShadow:'0 -8px 40px rgba(0,0,0,0.25)',
              maxHeight:'85vh',
              display:'flex',
              flexDirection:'column',
              overflow:'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              flexShrink:0,
              padding:'14px 20px 16px',
              borderBottom:'1px solid #f0f0f0',
              position:'relative',
            }}>
              <div style={{width:'40px',height:'4px',background:'#e5e7eb',borderRadius:'2px',margin:'0 auto 12px'}}/>
              <button
                onClick={() => setMostrarPanelProgreso(false)}
                style={{
                  position:'absolute',
                  top:'14px', right:'16px',
                  background:'#f3f4f6',
                  border:'none',
                  borderRadius:'50%',
                  width:'32px', height:'32px',
                  cursor:'pointer',
                  color:'#6b7280',
                  fontSize:'1rem',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                }}
              >
                ✕
              </button>
              <p style={{
                fontSize:'0.72rem',
                color:'#8b9aa8',
                textTransform:'uppercase',
                letterSpacing:'0.08em',
                fontWeight:600,
                margin:'0 0 2px',
              }}>
                Progreso del recorrido
              </p>
              <h2 style={{
                fontSize:'1.15rem',
                fontWeight:700,
                color:'#1a2a3a',
                margin:0,
                paddingRight:'40px',
                lineHeight:1.3,
              }}>
                {recorrido.nombre}
              </h2>

              {/* Contador visual */}
              <div style={{
                marginTop:'14px',
                display:'flex',
                alignItems:'center',
                gap:'12px',
              }}>
                <div style={{
                  fontSize:'1.6rem',
                  fontWeight:700,
                  color: recorridoCompletado ? '#16a34a' : '#1a2a3a',
                  lineHeight:1,
                }}>
                  {marcadasCount} <span style={{color:'#9ca3af',fontWeight:500,fontSize:'1.1rem'}}>/ {totalRecorrido}</span>
                </div>
                <div style={{
                  flex:1,
                  height:'8px',
                  background:'#f0f0f0',
                  borderRadius:'4px',
                  overflow:'hidden',
                }}>
                  <div style={{
                    width: `${totalRecorrido > 0 ? (marcadasCount / totalRecorrido) * 100 : 0}%`,
                    height:'100%',
                    background: recorridoCompletado ? '#16a34a' : '#c0392b',
                    transition:'width 0.4s ease, background 0.3s',
                    borderRadius:'4px',
                  }}/>
                </div>
              </div>
            </div>

            {/* Lista scrollable de baldosas */}
            <div style={{
              overflowY:'auto',
              padding:'10px 14px',
              flex:1,
            }}>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {recorrido.baldosas.map((b, idx) => {
                  const marcada = baldosasMarcadas.has(b.id)
                  return (
                    <div
                      key={b.id}
                      style={{
                        display:'flex',
                        alignItems:'center',
                        gap:'12px',
                        padding:'10px 12px',
                        background: marcada ? 'rgba(22,163,74,0.06)' : 'white',
                        border:'1px solid ' + (marcada ? 'rgba(22,163,74,0.25)' : '#e5e7eb'),
                        borderRadius:'10px',
                      }}
                    >
                      {/* Indicador de estado */}
                      <div style={{
                        flexShrink:0,
                        width:'24px',
                        height:'24px',
                        borderRadius:'50%',
                        background: marcada ? '#16a34a' : 'transparent',
                        border: marcada ? 'none' : '2px solid #d1d5db',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        color:'white',
                        fontSize:'0.75rem',
                        fontWeight:700,
                      }}>
                        {marcada ? '✓' : ''}
                      </div>

                      {/* Texto */}
                      <div style={{minWidth:0, flex:1}}>
                        <p style={{
                          fontSize:'0.88rem',
                          fontWeight:600,
                          color: marcada ? '#1a2a3a' : '#4a6b7c',
                          margin:0,
                          overflow:'hidden',
                          textOverflow:'ellipsis',
                          whiteSpace:'nowrap',
                        }}>
                          {idx + 1}. {b.nombre}
                        </p>
                        {b.direccion && (
                          <p style={{
                            fontSize:'0.76rem',
                            color:'#6b7280',
                            margin:'1px 0 0',
                            overflow:'hidden',
                            textOverflow:'ellipsis',
                            whiteSpace:'nowrap',
                          }}>
                            {b.direccion}
                          </p>
                        )}
                      </div>

                      {/* Estado textual */}
                      <span style={{
                        flexShrink:0,
                        fontSize:'0.7rem',
                        fontWeight:600,
                        color: marcada ? '#16a34a' : '#9ca3af',
                        textTransform:'uppercase',
                        letterSpacing:'0.05em',
                      }}>
                        {marcada ? 'Visitada' : 'Pendiente'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer con acciones */}
            <div style={{
              flexShrink:0,
              padding:'12px 20px 16px',
              borderTop:'1px solid #f0f0f0',
              background:'#fafafa',
            }}>
              {recorridoCompletado && (
                <button
                  onClick={descargarCertificado}
                  style={{
                    width:'100%',
                    padding:'0.9rem 1rem',
                    background:'#1a2a3a',
                    color:'white',
                    border:'none',
                    borderRadius:'12px',
                    fontSize:'0.95rem',
                    fontWeight:700,
                    cursor:'pointer',
                    letterSpacing:'0.01em',
                    fontFamily:'inherit',
                    marginBottom:'8px',
                  }}
                >
                  📄 Descargar certificado PDF
                </button>
              )}

              <button
                onClick={reiniciarRecorrido}
                style={{
                  width:'100%',
                  padding:'0.55rem 1rem',
                  background:'transparent',
                  color:'#9ca3af',
                  border:'none',
                  borderRadius:'8px',
                  fontSize:'0.78rem',
                  fontWeight:500,
                  cursor:'pointer',
                  fontFamily:'inherit',
                  textDecoration:'underline',
                  textUnderlineOffset:'2px',
                }}
              >
                Reiniciar recorrido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de felicitación + certificado ────────────────────── */}
      {mostrarCertificado && recorrido && (
        <div
          style={{
            position:'absolute', inset:0, zIndex:600,
            background:'rgba(10,18,28,0.78)',
            backdropFilter:'blur(4px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:'1.5rem',
          }}
          onClick={() => setMostrarCertificado(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:'white',
              borderRadius:'20px',
              padding:'2rem 1.75rem 1.75rem',
              maxWidth:'380px',
              width:'100%',
              boxShadow:'0 24px 64px rgba(0,0,0,0.5)',
              textAlign:'center',
              fontFamily:'sans-serif',
            }}
          >
            <div style={{fontSize:'3rem', marginBottom:'0.5rem'}}>🎉</div>
            <h2 style={{
              fontSize:'1.4rem',
              fontWeight:700,
              color:'#1a2a3a',
              margin:'0 0 0.5rem',
              lineHeight:1.25,
            }}>
              ¡Recorrido completado!
            </h2>
            <p style={{
              fontSize:'0.95rem',
              color:'#4a6b7c',
              margin:'0 0 1.25rem',
              lineHeight:1.5,
            }}>
              Visitaron las {totalRecorrido} baldosa{totalRecorrido !== 1 ? 's' : ''} del recorrido de {recorrido.nombre}.
            </p>

            <button
              onClick={descargarCertificado}
              style={{
                width:'100%',
                padding:'0.95rem 1rem',
                background:'#1a2a3a',
                color:'white',
                border:'none',
                borderRadius:'12px',
                fontSize:'1rem',
                fontWeight:700,
                cursor:'pointer',
                letterSpacing:'0.01em',
                marginBottom:'0.5rem',
                fontFamily:'inherit',
              }}
            >
              📄 Descargar certificado PDF
            </button>

            <button
              onClick={() => setMostrarCertificado(false)}
              style={{
                width:'100%',
                padding:'0.7rem 1rem',
                background:'transparent',
                color:'#4a6b7c',
                border:'none',
                borderRadius:'10px',
                fontSize:'0.88rem',
                fontWeight:500,
                cursor:'pointer',
                fontFamily:'inherit',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
