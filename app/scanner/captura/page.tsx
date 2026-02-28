'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Captura {
  id: number
  baldosaId: string
  nombre: string
  ubicacion: string
  lat: number
  lng: number
  foto: string
  fecha: string
}

export default function CapturaPage() {
  const router = useRouter()
  const [captura, setCaptura] = useState<Captura | null>(null)
  const [guardada, setGuardada] = useState(false)
  const [animando, setAnimando] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('recorremo_captura_pendiente')
    if (!raw) { router.replace('/scanner'); return }
    try { setCaptura(JSON.parse(raw)) }
    catch { router.replace('/scanner') }
  }, [router])

  const guardar = () => {
    if (!captura || guardada) return
    setAnimando(true)
    const existentes: Captura[] = JSON.parse(localStorage.getItem('recorremo_capturas') || '[]')
    existentes.push(captura)
    localStorage.setItem('recorremo_capturas', JSON.stringify(existentes))
    localStorage.removeItem('recorremo_captura_pendiente')
    setTimeout(() => { setGuardada(true); setAnimando(false) }, 500)
  }

  const descargar = () => {
    if (!captura) return
    const a = document.createElement('a')
    a.href = captura.foto
    const fecha = new Date(captura.fecha).toLocaleDateString('es-AR').replace(/\//g, '-')
    a.download = `recorremos-memoria-${fecha}.jpg`
    a.click()
  }

  const compartir = () => {
    alert('Compartir — próximamente')
  }

  const volver = () => {
    localStorage.removeItem('recorremo_captura_pendiente')
    router.push('/mapa')
  }

  if (!captura) {
    return (
      <div style={s.loading}>
        <div style={s.spinner} />
      </div>
    )
  }

  const fechaFormateada = new Date(captura.fecha).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin    { to { transform:rotate(360deg) } }

        .captura-root {
          position: fixed;
          inset: 0;
          background: #0a121c;
          display: flex;
          flex-direction: column;
          font-family: Georgia, serif;
        }
        .captura-foto-wrap {
          position: relative;
          flex: 1 1 auto;
          min-height: 55dvh;
          overflow: hidden;
          animation: fadeIn 0.5s ease-out;
        }
        .captura-foto {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .captura-foto-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10,18,28,0.9) 0%, rgba(10,18,28,0.1) 50%, transparent 100%);
        }
        .captura-foto-info {
          position: absolute;
          bottom: 1.25rem;
          left: 1.25rem;
          right: 1.25rem;
        }
        .captura-panel {
          flex-shrink: 0;
          background: #0f1923;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 1.5rem 1.5rem env(safe-area-inset-bottom, 1.5rem);
          animation: slideUp 0.5s ease-out 0.1s both;
        }
        .captura-panel-inner {
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .fecha-desktop { display: none; }

        /* Desktop: layout horizontal */
        @media (min-width: 768px) {
          .captura-root {
            flex-direction: row;
          }
          .captura-foto-wrap {
            flex: 1 1 60%;
            min-height: 100dvh;
          }
          .captura-foto-overlay {
            background: linear-gradient(to right, transparent 60%, rgba(10,18,28,0.95) 100%);
          }
          .captura-foto-info {
            display: none;
          }
          .captura-panel {
            flex: 0 0 380px;
            border-top: none;
            border-left: 1px solid rgba(255,255,255,0.08);
            display: flex;
            align-items: center;
            padding: 2.5rem 2rem;
            overflow-y: auto;
          }
          .captura-panel-inner {
            max-width: 100%;
            width: 100%;
          }
          .fecha-desktop {
            display: block;
            color: rgba(255,255,255,0.35);
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            margin: 0;
          }
        }
      `}</style>

      <div className="captura-root">

        <div className="captura-foto-wrap">
          <img src={captura.foto} alt="Captura AR" className="captura-foto" />
          <div className="captura-foto-overlay" />
          <div className="captura-foto-info">
            <p style={s.ubicacion}>📍 {captura.ubicacion}</p>
            <p style={s.fechaMobile}>{fechaFormateada}</p>
          </div>
        </div>

        <div className="captura-panel">
          <div className="captura-panel-inner">

            <p className="fecha-desktop">{fechaFormateada}</p>

            <div style={s.nombreWrap}>
              <p style={s.etiqueta}>En memoria de</p>
              <h1 style={s.nombre}>{captura.nombre}</h1>
              <div style={s.linea} />
              <p style={s.tagline}>Recorremos Memoria · Nunca Más</p>
            </div>

            <div style={s.acciones}>
              <button
                onClick={guardar}
                disabled={guardada || animando}
                style={{
                  ...s.btnPrimario,
                  background: guardada ? '#166534' : 'white',
                  color:      guardada ? 'white'   : '#0a121c',
                  opacity:    animando ? 0.7 : 1,
                }}
              >
                {guardada ? 'Guardada' : 'Guardar foto'}
              </button>

              <button onClick={descargar} style={s.btnSecundario}>
                Descargar
              </button>

              <button onClick={compartir} style={{ ...s.btnSecundario, opacity: 0.5, position: 'relative' }}>
                Compartir
                <span style={s.badge}>próximamente</span>
              </button>
            </div>

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
  ubicacion: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.82rem',
    margin: 0,
    letterSpacing: '0.04em',
  },
  fechaMobile: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.72rem',
    margin: '0.2rem 0 0',
    letterSpacing: '0.03em',
  },
  nombreWrap: {
    textAlign: 'center',
  },
  etiqueta: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.72rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    margin: '0 0 0.4rem',
  },
  nombre: {
    color: 'white',
    fontSize: 'clamp(1.3rem, 3vw, 2rem)',
    fontWeight: 400,
    margin: '0 0 0.75rem',
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
  },
  linea: {
    width: '2.5rem',
    height: '1px',
    background: 'rgba(255,255,255,0.25)',
    margin: '0 auto 0.6rem',
  },
  tagline: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    margin: 0,
  },
  acciones: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  btnPrimario: {
    padding: '0.85rem',
    borderRadius: '10px',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'Georgia, serif',
    width: '100%',
  },
  btnSecundario: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    width: '100%',
    transition: 'background 0.2s',
  },
  badge: {
    position: 'absolute',
    right: '0.85rem',
    fontSize: '0.6rem',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  btnVolver: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.35)',
    fontSize: '0.82rem',
    cursor: 'pointer',
    letterSpacing: '0.06em',
    textAlign: 'center',
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
