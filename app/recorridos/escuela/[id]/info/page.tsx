'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface BaldosaRecorrido {
  id: string
  codigo: string
  nombre: string
  lat: number
  lng: number
  direccion: string
  barrio?: string
}

interface DatosRecorrido {
  id: string
  nombre: string
  direccion: string
  barrio: string
  lat: number
  lng: number
  baldosas: BaldosaRecorrido[]
  ruta_geojson: GeoJSON.LineString | null
}

export default function InfoRecorridoPage() {
  const { id } = useParams<{ id: string }>()
  const [recorrido, setRecorrido] = useState<DatosRecorrido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
    return (
      <div className="hero-background" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-dust)', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏫</div>
          <p>Cargando recorrido…</p>
        </div>
      </div>
    )
  }

  if (error || !recorrido) {
    return (
      <div className="hero-background" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#c0392b', padding: '2rem', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <p>{error ?? 'Recorrido no encontrado'}</p>
          <a href="/recorridos/escuela" style={{ color: 'var(--color-stone)', fontSize: '0.9rem' }}>
            ← Volver al listado
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="hero-background">
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: 'var(--space-lg) var(--space-md)',
        maxWidth: '780px',
        margin: '0 auto',
      }}>

        {/* Breadcrumb / volver */}
        <div style={{
          opacity: 0,
          animation: 'slideUpFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.1s forwards',
          marginBottom: 'var(--space-md)',
        }}>
          <a
            href="/recorridos/escuela"
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-dust)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Recorridos de escuelas
          </a>
        </div>

        {/* Encabezado */}
        <div style={{
          opacity: 0,
          animation: 'slideUpFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.25s forwards',
          marginBottom: 'var(--space-md)',
        }}>
          {recorrido.barrio && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              marginBottom: '6px',
            }}>
              {recorrido.barrio}
            </div>
          )}
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            color: 'var(--color-stone)',
            marginBottom: '8px',
            lineHeight: 1.2,
          }}>
            {recorrido.nombre}
          </h1>
          {recorrido.direccion && (
            <p style={{
              fontSize: '1rem',
              color: 'var(--color-concrete)',
              margin: 0,
            }}>
              {recorrido.direccion}
            </p>
          )}
        </div>

        {/* CTA principal: ir al mapa */}
        <div style={{
          opacity: 0,
          animation: 'slideUpFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.4s forwards',
          marginBottom: 'var(--space-lg)',
        }}>
          <a
            href={`/recorridos/escuela/${recorrido.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.85rem 1.4rem',
              background: 'var(--color-stone)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.01em',
              boxShadow: 'var(--shadow-medium)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Comenzar recorrido en el mapa
          </a>
        </div>

        {/* Lista de baldosas */}
        <div style={{
          opacity: 0,
          animation: 'slideUpFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.55s forwards',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.3rem, 3vw, 1.7rem)',
            color: 'var(--color-stone)',
            marginBottom: 'var(--space-sm)',
          }}>
            Baldosas del recorrido
            <span style={{
              fontSize: '0.95rem',
              color: 'var(--color-dust)',
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              marginLeft: '0.5rem',
            }}>
              · {recorrido.baldosas.length}
            </span>
          </h2>

          {recorrido.baldosas.length === 0 ? (
            <p style={{ color: 'var(--color-dust)', opacity: 0.8 }}>
              Este recorrido todavía no tiene baldosas cargadas.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {recorrido.baldosas.map((b, idx) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(37, 99, 235, 0.15)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                >
                  <div style={{
                    flexShrink: 0,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-stone)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--color-stone)',
                      marginBottom: '2px',
                      lineHeight: 1.3,
                      letterSpacing: '-0.01em',
                    }}>
                      {b.nombre}
                    </div>
                    {b.direccion && (
                      <div style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-concrete)',
                      }}>
                        {b.direccion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
