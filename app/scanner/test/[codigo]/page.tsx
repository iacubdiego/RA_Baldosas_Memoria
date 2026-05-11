'use client'

/**
 * /scanner/test/[codigo]
 *
 * Lanza el LocationARScanner en modo test para la baldosa indicada.
 *
 * Comportamiento:
 *   - Sin query params: saltea GPS y entra directo a la escena AR.
 *   - Con ?lat=X&lng=Y: simula GPS en esas coordenadas, deja correr el
 *     flujo normal de proximidad (la AR se activa sola si las coords
 *     están dentro del radio de activación de la baldosa).
 *
 * En modo test:
 *   - No se ejecuta el PATCH a /api/baldosas/[codigo] (no incrementa
 *     vecesEscaneada).
 *   - Se muestra un chip MODO TEST en el HUD.
 *   - El botón "Volver" redirige a /scanner/test en vez de /mapa.
 */

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'

interface Baldosa {
  id: string
  codigo: string
  nombre: string
  categoria: string
  descripcion?: string
  mensajeAR: string
  infoExtendida?: string
  fotosUrls?: string[]
  audioUrl?: string
  lat: number
  lng: number
  direccion?: string
  barrio?: string
  vecesEscaneada?: number
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────

function PantallaCargando({ texto }: { texto: string }) {
  return (
    <div style={estilos.pantalla}>
      <div style={estilos.spinner} />
      <p style={{ opacity: 0.7, marginTop: '1rem' }}>{texto}</p>
    </div>
  )
}

function PantallaError({ mensaje }: { mensaje: string }) {
  return (
    <div style={{ ...estilos.pantalla, padding: '2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={estilos.errorTitulo}>No se pudo cargar</h2>
      <p style={estilos.errorMensaje}>{mensaje}</p>
      <Link href="/scanner/test" style={estilos.btnVolver}>
        Volver al listado
      </Link>
    </div>
  )
}

// ─── Carga dinámica del componente AR ────────────────────────────────────────

const LocationARScanner = dynamic(
  () => import('../../../../components/LocationARScanner'),
  {
    ssr: false,
    loading: () => <PantallaCargando texto="Cargando…" />,
  }
)

// ─── Página ──────────────────────────────────────────────────────────────────

export default function ScannerTestCodigoPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const codigo       = params?.codigo as string
  const latParam     = searchParams?.get('lat') ?? null
  const lngParam     = searchParams?.get('lng') ?? null

  const [baldosa,  setBaldosa]  = useState<Baldosa | null>(null)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!codigo) return
    let cancelado = false
    fetch(`/api/baldosas/${codigo}`)
      .then(r => r.json())
      .then(d => {
        if (cancelado) return
        if (d.baldosa) setBaldosa(d.baldosa)
        else setError(`No se encontró la baldosa "${codigo}".`)
      })
      .catch(() => {
        if (!cancelado) setError('Error al consultar la baldosa.')
      })
    return () => { cancelado = true }
  }, [codigo])

  if (error)   return <PantallaError mensaje={error} />
  if (!baldosa) return <PantallaCargando texto="Cargando baldosa…" />

  const lat = latParam !== null ? parseFloat(latParam) : NaN
  const lng = lngParam !== null ? parseFloat(lngParam) : NaN
  const coordsValidas = !isNaN(lat) && !isNaN(lng)
  const coordsForzadas = coordsValidas ? { lat, lng } : null

  return (
    <>
      <style jsx global>{`
        @keyframes pulso {
          0%   { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        body > main + * .navbar,
        nav.navbar {
          display: none !important;
        }
      `}</style>

      <LocationARScanner
        baldosaForzada={coordsForzadas ? null : baldosa}
        baldosaUnica={coordsForzadas ? baldosa : null}
        coordsForzadas={coordsForzadas}
        modoTest={true}
      />
    </>
  )
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const estilos: Record<string, React.CSSProperties> = {
  pantalla: {
    minHeight:      '100vh',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    background:     'var(--color-stone)',
    color:          'var(--color-parchment)',
    textAlign:      'center',
  },
  spinner: {
    width:        '44px',
    height:       '44px',
    border:       '3px solid rgba(255,255,255,0.15)',
    borderTop:    '3px solid #2563eb',
    borderRadius: '50%',
    animation:    'spin 0.9s linear infinite',
  },
  errorTitulo: {
    fontFamily:   'var(--font-display)',
    fontSize:     '1.4rem',
    marginBottom: '0.75rem',
  },
  errorMensaje: {
    color:        '#fca5a5',
    lineHeight:   1.6,
    marginBottom: '1.5rem',
    maxWidth:     '400px',
  },
  btnVolver: {
    padding:        '0.85rem 1.5rem',
    background:     'var(--color-primary)',
    color:          'white',
    textDecoration: 'none',
    borderRadius:   '10px',
    fontWeight:     600,
  },
}
