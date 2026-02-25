'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
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

const destinoIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.059 27.941 0 18 0z" fill="#dc2626"/>
      <circle cx="18" cy="18" r="9" fill="white"/>
      <circle cx="18" cy="18" r="4.5" fill="#dc2626"/>
    </svg>
  `),
  iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -44],
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

interface Pin { id:string; codigo:string; nombre:string; direccion:string; barrio:string; lat:number; lng:number }
interface BaldosaCercana { id:string; codigo:string; nombre:string; lat:number; lng:number; direccion:string; barrio:string; mensajeAR:string; distancia?:number }
interface MapViewProps { initialLocation: { lat:number; lng:number } }

function calcularDistancia(lat1:number,lng1:number,lat2:number,lng2:number):number {
  const R=6371e3, ph1=(lat1*Math.PI)/180, ph2=(lat2*Math.PI)/180
  const dp=((lat2-lat1)*Math.PI)/180, dl=((lng2-lng1)*Math.PI)/180
  const a=Math.sin(dp/2)**2+Math.cos(ph1)*Math.cos(ph2)*Math.sin(dl/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

function formatearDistancia(m:number):string {
  return m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(1)} km`
}

function MapFitter({pins}:{pins:Pin[]}) {
  const map=useMap(), done=useRef(false)
  useEffect(()=>{ if(pins.length>0&&!done.current){done.current=true; map.fitBounds(L.latLngBounds(pins.map(p=>[p.lat,p.lng] as [number,number])),{padding:[50,50],maxZoom:15})} },[pins,map])
  return null
}

function RouteController({userLocation,destino}:{userLocation:{lat:number;lng:number}|null; destino:{lat:number;lng:number}|null}) {
  const map=useMap()
  useEffect(()=>{ if(destino&&userLocation){ map.fitBounds(L.latLngBounds([[userLocation.lat,userLocation.lng],[destino.lat,destino.lng]]),{padding:[80,80],maxZoom:17}) } },[destino,userLocation,map])
  return null
}

export default function MapView({ initialLocation }:MapViewProps) {
  const [pins,setPins]=useState<Pin[]>([])
  const [loadingPins,setLoadingPins]=useState(true)
  const [userLocation,setUserLocation]=useState<{lat:number;lng:number}|null>(null)
  const [loadingLocation,setLoadingLocation]=useState(true)
  const [panelAbierto,setPanelAbierto]=useState(false)
  const [cercanas,setCercanas]=useState<BaldosaCercana[]>([])
  const [loadingCercanas,setLoadingCercanas]=useState(false)
  const [cargado,setCargado]=useState(false)
  const [destino,setDestino]=useState<BaldosaCercana|null>(null)
  const [ruta,setRuta]=useState<[number,number][]>([])
  const [loadingRuta,setLoadingRuta]=useState(false)

  useEffect(()=>{
    if(!navigator.geolocation){setLoadingLocation(false);return}
    navigator.geolocation.getCurrentPosition(
      pos=>{setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude});setLoadingLocation(false)},
      ()=>setLoadingLocation(false),
      {enableHighAccuracy:true,timeout:10000}
    )
  },[])

  useEffect(()=>{
    fetch('/api/baldosas/pins').then(r=>r.json()).then(d=>setPins(d.pins||[])).catch(console.error).finally(()=>setLoadingPins(false))
  },[])

  const abrirPanel=()=>{
    setPanelAbierto(true)
    if(cargado)return
    setLoadingCercanas(true); setCargado(true)
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

  const fetchRutaOSRM=async(origen:{lat:number;lng:number},dest:{lat:number;lng:number})=>{
    setLoadingRuta(true)
    try {
      // OSRM public server — walking profile
      const url=`https://router.project-osrm.org/route/v1/foot/${origen.lng},${origen.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      const res=await fetch(url)
      const data=await res.json()
      if(data.routes&&data.routes[0]){
        // GeoJSON coords son [lng,lat] — invertir para Leaflet [lat,lng]
        const coords:[number,number][]=data.routes[0].geometry.coordinates.map(([lng,lat]:[number,number])=>[lat,lng])
        setRuta(coords)
      }
    } catch(e) {
      console.error('Error OSRM:',e)
      // Fallback: línea recta
      if(userLocation) setRuta([[userLocation.lat,userLocation.lng],[dest.lat,dest.lng]])
    } finally {
      setLoadingRuta(false)
    }
  }

  const iniciarRecorrido=(b:BaldosaCercana)=>{
    if(destino?.id===b.id){ setDestino(null); setRuta([]); return }
    setDestino(b); setRuta([]); setPanelAbierto(false)
    if(userLocation) fetchRutaOSRM(userLocation,{lat:b.lat,lng:b.lng})
  }



  // ruta viene de OSRM (se actualiza en iniciarRecorrido)

  return (
    <div style={{position:'relative',width:'100%',height:'100dvh'}}>

      <MapContainer center={[userLocation?.lat??initialLocation.lat,userLocation?.lng??initialLocation.lng]} zoom={13} style={{width:'100%',height:'100%'}} zoomControl={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        {ruta.length>1&&<Polyline positions={ruta} pathOptions={{color:'#2563eb',weight:5,opacity:0.9}}/>}
        {userLocation&&<Marker position={[userLocation.lat,userLocation.lng]} icon={userIcon}><Popup><div style={{fontFamily:'sans-serif',textAlign:'center'}}><strong>Tu ubicación</strong></div></Popup></Marker>}
        {destino&&(
          <Marker position={[destino.lat,destino.lng]} icon={destinoIcon}>
            <Popup>
              <div style={{fontFamily:'sans-serif',minWidth:'180px'}}>
                <p style={{fontWeight:700,color:'#1a2a3a',margin:'0 0 4px'}}>{destino.nombre}</p>
                {destino.direccion&&<p style={{fontSize:'0.82rem',color:'#4a6b7c',margin:'0 0 8px'}}>{destino.direccion}</p>}
                {loadingRuta&&<p style={{fontSize:'0.78rem',color:'#6b7280',margin:'0 0 6px',textAlign:'center'}}>Calculando ruta…</p>}
                <button onClick={()=>{setDestino(null);setRuta([])}} style={{width:'100%',padding:'6px',background:'#f3f4f6',color:'#6b7280',border:'none',borderRadius:'6px',fontSize:'0.78rem',cursor:'pointer'}}>Cancelar recorrido</button>
              </div>
            </Popup>
          </Marker>
        )}
        {pins.map(pin=>{
          if(destino?.id===pin.id)return null
          const dist=userLocation?calcularDistancia(userLocation.lat,userLocation.lng,pin.lat,pin.lng):null
          const cerca=dist!==null&&dist<=RADIO_MAXIMO
          return(
            <Marker key={pin.id} position={[pin.lat,pin.lng]} icon={baldosaIcon}>
              <Popup>
                <div style={{fontFamily:'sans-serif',minWidth:'190px'}}>
                  <h3 style={{fontSize:'0.95rem',color:'#1a2a3a',margin:'0 0 4px'}}>{pin.nombre}</h3>
                  {pin.direccion&&<p style={{fontSize:'0.8rem',color:'#4a6b7c',margin:'0 0 6px'}}>📍 {pin.direccion}</p>}
                  {dist!==null&&<p style={{fontSize:'0.8rem',fontWeight:600,color:cerca?'#166534':'#4b5563',margin:'0 0 8px'}}>{cerca?'✓ Estás cerca':`📏 ${formatearDistancia(dist)}`}</p>}
                  {userLocation&&<button onClick={()=>iniciarRecorrido({...pin,mensajeAR:''})} style={{width:'100%',padding:'7px',background:'#2563eb',color:'white',border:'none',borderRadius:'6px',fontSize:'0.82rem',fontWeight:600,cursor:'pointer'}}>Cómo llegar</button>}
                </div>
              </Popup>
            </Marker>
          )
        })}
        <MapFitter pins={pins}/>
        <RouteController userLocation={userLocation} destino={destino}/>
      </MapContainer>

      {/* Navbar superpuesta */}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:400,background:'rgba(26,42,58,0.92)',backdropFilter:'blur(8px)',borderBottom:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1rem',height:'48px'}}>
        <a href="/" style={{color:'white',textDecoration:'none',fontSize:'0.9rem',fontWeight:600,opacity:0.85}}>← Inicio</a>
        <span style={{color:'white',fontSize:'0.85rem',fontWeight:500,opacity:0.7}}>Baldosas por la Memoria</span>
        {!loadingPins&&<span style={{color:'white',fontSize:'0.78rem',opacity:0.6}}>{pins.length.toLocaleString('es-AR')} baldosas</span>}
      </div>

      {/* Banner recorrido activo */}
      {destino&&(
        <div style={{position:'absolute',top:'48px',left:0,right:0,zIndex:400,background:'#2563eb',color:'white',padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'0.85rem',fontWeight:500}}>
          <span>→ {destino.nombre}{destino.distancia?` · ${formatearDistancia(destino.distancia)}`:''}</span>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            {loadingRuta&&<span style={{fontSize:'0.75rem',opacity:0.8}}>Calculando…</span>}
            <button onClick={()=>{setDestino(null);setRuta([])}} style={{background:'transparent',border:'none',color:'rgba(255,255,255,0.7)',fontSize:'1.1rem',cursor:'pointer'}}>✕</button>
          </div>
        </div>
      )}

      {/* Botón abrir panel */}
      {!panelAbierto&&(
        <button onClick={abrirPanel} style={{position:'absolute',bottom:'2.5rem',left:'50%',transform:'translateX(-50%)',zIndex:400,background:'#1a2a3a',color:'white',border:'none',borderRadius:'14px',padding:'1rem 2.5rem',fontSize:'1.05rem',fontWeight:700,cursor:'pointer',boxShadow:'0 6px 20px rgba(0,0,0,0.3)',whiteSpace:'nowrap',minWidth:'220px',textAlign:'center'}}>
          Ver baldosas cercanas
        </button>
      )}

      {/* Panel inferior */}
      {panelAbierto&&(
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:400,background:'white',borderRadius:'20px 20px 0 0',boxShadow:'0 -6px 32px rgba(0,0,0,0.18)',maxHeight:'45vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* Header */}
          <div style={{flexShrink:0,padding:'12px 16px 10px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'flex-start',justifyContent:'space-between',background:'white',borderRadius:'20px 20px 0 0'}}>
            <div>
              <div style={{width:'40px',height:'4px',background:'#e5e7eb',borderRadius:'2px',margin:'0 auto 8px'}}/>
              <p style={{fontSize:'1rem',fontWeight:700,color:'#1a2a3a',margin:0}}>
                {userLocation?`${LIMIT_CERCANAS} baldosas más cercanas`:`Primeras ${LIMIT_CERCANAS} baldosas`}
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
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
                        {b.distancia!==undefined&&(
                          <span style={{fontSize:'0.75rem',fontWeight:600,padding:'3px 8px',borderRadius:'12px',background:cerca?'#dcfce7':'#f3f4f6',color:cerca?'#166534':'#6b7280'}}>
                            {cerca?'✓ Cerca':formatearDistancia(b.distancia)}
                          </span>
                        )}
                        <button onClick={()=>iniciarRecorrido(b)} style={{background:activa?'#fee2e2':'#eff6ff',border:'none',borderRadius:'8px',padding:'5px 10px',fontSize:'0.78rem',fontWeight:600,color:activa?'#dc2626':'#2563eb',cursor:'pointer',whiteSpace:'nowrap',opacity:loadingRuta&&!activa?0.6:1}}>
                          {activa?'Cancelar':'Ir →'}
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
    </div>
  )
}
