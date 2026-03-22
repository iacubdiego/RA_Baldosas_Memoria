'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Foto {
  id: number
  baldosaId: string
  nombre: string
  ubicacion: string
  lat: number
  lng: number
  foto: string
  fecha: string
}

export default function FotoPage() {
  const router = useRouter()
  const [foto, setFoto] = useState<Foto | null>(null)
  const [puedeCompartir, setPuedeCompartir] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('recorremo_foto_pendiente')
    if (!raw) { router.replace('/scanner'); return }
    try { setFoto(JSON.parse(raw)) }
    catch { router.replace('/scanner') }
  }, [router])

  useEffect(() => {
    setPuedeCompartir(!!navigator.share)
  }, [])

  const descargar = () => {
    if (!foto) return
    const a = document.createElement('a')
    a.href = foto.foto
    const d = new Date(foto.fecha)
    const fecha = d.toLocaleDateString('es-AR').replace(/\//g, '-')
    const hora  = `${String(d.getHours()).padStart(2,'0')}-${String(d.getMinutes()).padStart(2,'0')}-${String(d.getSeconds()).padStart(2,'0')}`
    a.download = `recorremos-memoria-${fecha}_${hora}.jpg`
    a.click()
  }

  const compartir = async () => {
    if (!foto) return
    try {
      const res  = await fetch(foto.foto)
      const blob = await res.blob()
      const d = new Date(foto.fecha)
      const fecha = d.toLocaleDateString('es-AR').replace(/\//g, '-')
      const hora  = `${String(d.getHours()).padStart(2,'0')}-${String(d.getMinutes()).padStart(2,'0')}-${String(d.getSeconds()).padStart(2,'0')}`
      const file = new File([blob], `recorremos-memoria-${fecha}_${hora}.jpg`, { type: 'image/jpeg' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `En memoria de ${foto.nombre}`,
          text: 'Recorremos Memoria · Nunca Más',
          files: [file],
        })
      } else if (navigator.share) {
        await navigator.share({
          title: `En memoria de ${foto.nombre}`,
          text: 'Recorremos Memoria · Nunca Más',
          url: window.location.origin,
        })
      } else {
        descargar()
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') console.warn('Error al compartir:', e)
    }
  }

  const volver = () => {
    localStorage.removeItem('recorremo_foto_pendiente')
    router.push('/mapa')
  }

  if (!foto) {
    return (
      <div style={s.loading}>
        <div style={s.spinner} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin    { to { transform:rotate(360deg) } }
      `}</style>

      {/* Foto: fondo completo */}
      <div style={s.root}>
        <img src={foto.foto} alt="Foto AR" style={s.img} />

        {/* Gradiente inferior */}
        <div style={s.gradiente} />

        {/* Info top: ubicación */}
        <div style={s.topBar}>
          <p style={s.ubicacion}>📍 {foto.ubicacion}</p>
        </div>

        {/* Panel inferior superpuesto */}
        <div style={s.bottomPanel}>
          <p style={s.enMemoria}>En memoria de</p>
          <h1 style={s.nombre}>{foto.nombre}</h1>
          <p style={s.tagline}>Recorremos Memoria · Nunca Más</p>

          <div style={s.botonesRow}>
            <button onClick={compartir} style={s.btnShare}>
              <span style={s.btnIcon}>↑</span>
              Compartir
            </button>
            <button onClick={descargar} style={s.btnDescargar}>
              <span style={s.btnIcon}>⬇</span>
              Descargar
            </button>
          </div>

          <div style={s.botonesCol}>
            <button
              onClick={() => {
                localStorage.removeItem('recorremo_foto_pendiente')
                router.push('/scanner')
              }}
              style={s.btnSecundario}
            >
              Volver a la cámara
            </button>

            <button onClick={volver} style={s.btnVolver}>
              Seguir caminando →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    background: '#0a121c',
    overflow: 'hidden',
  },
  img: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center top',
    display: 'block',
    animation: 'fadeIn 0.4s ease-out',
  },
  gradiente: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(10,18,28,0.97) 0%, rgba(10,18,28,0.6) 35%, rgba(10,18,28,0.25) 55%, transparent 75%)',
    pointerEvents: 'none',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '1rem 1.25rem',
    background: 'linear-gradient(to bottom, rgba(10,18,28,0.7) 0%, transparent 100%)',
    animation: 'fadeIn 0.5s ease-out',
  },
  ubicacion: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '0.8rem',
    margin: 0,
    letterSpacing: '0.04em',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '1.5rem 1.5rem calc(env(safe-area-inset-bottom, 0px) + 1.25rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    animation: 'slideUp 0.45s ease-out 0.1s both',
  },
  enMemoria: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.68rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    margin: 0,
    fontFamily: 'Georgia, serif',
  },
  nombre: {
    color: 'white',
    fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
    fontWeight: 400,
    margin: '0 0 0.1rem',
    lineHeight: 1.2,
    fontFamily: 'Georgia, serif',
  },
  tagline: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: '0.62rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    margin: '0 0 0.75rem',
    fontFamily: 'Georgia, serif',
  },
  botonesRow: {
    display: 'flex',
    gap: '0.6rem',
    marginBottom: '0.4rem',
  },
  btnShare: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.8rem',
    borderRadius: '10px',
    border: 'none',
    background: 'white',
    color: '#0a121c',
    fontSize: '0.92rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
  },
  btnDescargar: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.8rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.12)',
    color: 'white',
    fontSize: '0.92rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
  },
  btnIcon: {
    fontSize: '1rem',
  },
  botonesCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  btnSecundario: {
    padding: '0.7rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.75)',
    fontSize: '0.88rem',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    width: '100%',
    textAlign: 'center' as const,
  },
  btnVolver: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    letterSpacing: '0.06em',
    textAlign: 'center' as const,
    padding: '0.25rem',
    fontFamily: 'Georgia, serif',
    width: '100%',
  },
  loading: {
    position: 'fixed',
    inset: 0,
    background: '#0a121c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
}
