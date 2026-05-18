'use client'

import { useEffect, useMemo, useState } from 'react'

interface EscuelaItem {
  id: string
  nombre: string
  direccion: string
  barrio: string
  lat: number
  lng: number
  baldosas_ids: string[]
  ruta_geojson: GeoJSON.LineString | null
}

// ─── Imagen del hero (reemplazar por la que subas a public/images) ────────
//   Mismo ratio que la baldosa (480 x 280) queda óptimo,
//   pero como la clase .baldosa-img aplica object-fit: cover,
//   cualquier ratio se ve bien.
const HERO_IMAGE = '/images/escuelas-hero.jpg'

export default function EscuelasIndexPage() {
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    fetch('/api/escuelas')
      .then(r => {
        if (!r.ok) throw new Error('No se pudo cargar el listado de escuelas')
        return r.json()
      })
      .then(data => setEscuelas(data.escuelas ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const escuelasFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return escuelas
    return escuelas.filter(e =>
      e.nombre.toLowerCase().includes(q) ||
      (e.barrio || '').toLowerCase().includes(q) ||
      (e.direccion || '').toLowerCase().includes(q)
    )
  }, [escuelas, filtro])

  return (
    <div className="hero-background">
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-lg)',
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '900px' }}>

          {/* ── HERO: imagen central (reemplazo de la baldosa) ── */}
          <div className="logo-baldosa-container">
            <div className="baldosa-animada">
              <img
                src={HERO_IMAGE}
                alt="Recorridos de la memoria realizados por escuelas"
                className="baldosa-img"
                loading="eager"
              />
            </div>
          </div>

          {/* ── Título ── */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 0.6s forwards',
          }}>
            <h1 style={{
              marginBottom: 'var(--space-md)',
              color: 'var(--color-stone)',
            }}>
              Escuelas y memoria
            </h1>
          </div>

          {/* ── Resumen ── */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 0.9s forwards',
          }}>
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--color-concrete)',
              maxWidth: '600px',
              margin: '0 auto var(--space-md)',
              lineHeight: 1.8,
            }}>
              Cada escuela construye su propio recorrido por las baldosas que
              homenajean a víctimas del terrorismo de Estado en su barrio.
              Conocé los recorridos armados junto a estudiantes, docentes y
              comunidades educativas, y entrá al mapa para caminarlos.
            </p>
          </div>

          {/* ── Buscador + Listado ── */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 1.2s forwards',
            marginTop: 'var(--space-lg)',
            width: '100%',
            maxWidth: '720px',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '0 var(--space-sm)',
          }}>
            <input
              type="search"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar por escuela, barrio o dirección…"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-body)',
                border: '1.5px solid rgba(37, 99, 235, 0.2)',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.85)',
                color: 'var(--color-stone)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color var(--transition-fast), background var(--transition-fast)',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.5)'
                e.currentTarget.style.background = '#fff'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.85)'
              }}
            />

            {/* Estados */}
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-lg) var(--space-md)',
                color: 'var(--color-dust)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏫</div>
                <p style={{ margin: 0 }}>Cargando escuelas…</p>
              </div>
            )}

            {error && !loading && (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-lg) var(--space-md)',
                color: '#c0392b',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}

            {!loading && !error && escuelasFiltradas.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-lg) var(--space-md)',
                color: 'var(--color-dust)',
                opacity: 0.8,
              }}>
                <p style={{ margin: 0 }}>
                  {escuelas.length === 0
                    ? 'Todavía no hay recorridos cargados.'
                    : 'No se encontraron escuelas con ese filtro.'}
                </p>
              </div>
            )}

            {/* Cards */}
            {!loading && !error && escuelasFiltradas.length > 0 && (
              <div style={{
                marginTop: 'var(--space-md)',
                display: 'grid',
                gap: 'var(--space-sm)',
                textAlign: 'left',
              }}>
                {escuelasFiltradas.map(e => (
                  <a
                    key={e.id}
                    href={`/recorridos/escuela/${e.id}`}
                    className="hover-lift"
                    style={{
                      display: 'block',
                      padding: 'var(--space-md)',
                      background: 'rgba(255,255,255,0.85)',
                      border: '1px solid rgba(37, 99, 235, 0.15)',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      color: 'inherit',
                      boxShadow: 'var(--shadow-soft)',
                    }}
                  >
                    {e.barrio && (
                      <div style={{
                        fontSize: '0.72rem',
                        color: 'var(--color-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}>
                        {e.barrio}
                      </div>
                    )}
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(1.05rem, 2.5vw, 1.2rem)',
                      fontWeight: 700,
                      marginBottom: '4px',
                      color: 'var(--color-stone)',
                      lineHeight: 1.3,
                      letterSpacing: '-0.01em',
                    }}>
                      {e.nombre}
                    </div>
                    {e.direccion && (
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--color-concrete)',
                        marginBottom: '8px',
                      }}>
                        {e.direccion}
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-dust)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '8px',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}>
                      <span>
                        {e.baldosas_ids.length} baldosa{e.baldosas_ids.length !== 1 ? 's' : ''} en el recorrido
                      </span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        Ver en el mapa →
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
