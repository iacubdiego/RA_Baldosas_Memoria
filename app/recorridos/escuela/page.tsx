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

// Categorías disponibles (matchean con el enum del modelo Baldosa).
// Estas etiquetas las puede ajustar Diego más adelante.
const CATEGORIAS = [
  { id: 'artista',    label: 'Artistas' },
  { id: 'politico',   label: 'Políticxs' },
  { id: 'historico',  label: 'Históricxs' },
  { id: 'deportista', label: 'Deportistas' },
  { id: 'cultural',   label: 'Culturales' },
  { id: 'otro',       label: 'Otros' },
]

// Defaults razonables si el usuario no toca nada
const DEFAULT_RADIO = 500
const RADIO_MIN = 100
const RADIO_MAX = 1500
const RADIO_STEP = 50

const HERO_IMAGE = '/images/escuelas-hero.jpg'

export default function EscuelasIndexPage() {
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')

  // ── Filtros del recorrido ──
  const [radio, setRadio] = useState<number>(DEFAULT_RADIO)
  const [catsSeleccionadas, setCatsSeleccionadas] = useState<string[]>(
    CATEGORIAS.map(c => c.id) // todas marcadas por default
  )

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

  const toggleCategoria = (id: string) => {
    setCatsSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  /** Arma el href hacia el mapa con los filtros como query params */
  const hrefParaEscuela = (escuelaId: string) => {
    const params = new URLSearchParams()
    params.set('radio', String(radio))
    if (catsSeleccionadas.length > 0 && catsSeleccionadas.length < CATEGORIAS.length) {
      // Si están todas seleccionadas, no incluir el param (URL más limpia)
      params.set('cats', catsSeleccionadas.join(','))
    }
    return `/recorridos/escuela/${escuelaId}?${params.toString()}`
  }

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

          {/* ── HERO: imagen central ── */}
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
            <h1 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-stone)' }}>
              Escuelas y memoria
            </h1>
          </div>

          {/* ── Resumen ── */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 0.9s forwards',
          }}>
            <p style={{
              fontSize: '1.15rem',
              color: 'var(--color-concrete)',
              maxWidth: '620px',
              margin: '0 auto var(--space-md)',
              lineHeight: 1.7,
            }}>
              Elegí tu escuela y armá un recorrido propio por las baldosas que
              homenajean a víctimas del terrorismo de Estado en tu barrio.
              Ajustá la distancia y las categorías para personalizar la
              experiencia con tu grupo.
            </p>
          </div>

          {/* ── Bloque de filtros ── */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 1.1s forwards',
            marginTop: 'var(--space-lg)',
            width: '100%',
            maxWidth: '720px',
            margin: 'var(--space-lg) auto 0',
            padding: 'var(--space-md)',
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(37, 99, 235, 0.15)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-soft)',
            textAlign: 'left',
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              margin: '0 0 var(--space-sm)',
              textAlign: 'center',
            }}>
              Filtros del recorrido
            </p>

            {/* ── Slider de radio ── */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '6px',
              }}>
                <label
                  htmlFor="filtro-radio"
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--color-stone)',
                  }}
                >
                  Distancia desde la escuela
                </label>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                }}>
                  {radio} m
                </span>
              </div>
              <input
                id="filtro-radio"
                type="range"
                min={RADIO_MIN}
                max={RADIO_MAX}
                step={RADIO_STEP}
                value={radio}
                onChange={e => setRadio(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: 'var(--color-dust)',
                marginTop: '2px',
              }}>
                <span>{RADIO_MIN} m</span>
                <span>{RADIO_MAX} m</span>
              </div>
            </div>

            {/* ── Checkboxes de categorías ── */}
            <div>
              <p style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-stone)',
                margin: '0 0 8px',
              }}>
                Categorías
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}>
                {CATEGORIAS.map(c => {
                  const activo = catsSeleccionadas.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategoria(c.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: '1.5px solid ' + (activo ? 'var(--color-primary)' : 'rgba(74,107,124,0.25)'),
                        background: activo ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                        color: activo ? 'var(--color-primary)' : 'var(--color-dust)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        letterSpacing: '0.01em',
                        textTransform: 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {activo && '✓ '}{c.label}
                    </button>
                  )
                })}
              </div>
              {catsSeleccionadas.length === 0 && (
                <p style={{
                  fontSize: '0.78rem',
                  color: '#c0392b',
                  marginTop: '8px',
                  marginBottom: 0,
                }}>
                  Si no elegís categorías, no se va a mostrar ninguna baldosa.
                </p>
              )}
            </div>
          </div>

          {/* ── Buscador + Listado ── */}
          <div style={{
            opacity: 0,
            animation: 'slideUpFade 0.9s cubic-bezier(0.25, 1, 0.5, 1) 1.3s forwards',
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
              }}
            />

            {/* Estados */}
            {loading && (
              <div style={{ textAlign: 'center', padding: 'var(--space-lg) var(--space-md)', color: 'var(--color-dust)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏫</div>
                <p style={{ margin: 0 }}>Cargando escuelas…</p>
              </div>
            )}

            {error && !loading && (
              <div style={{ textAlign: 'center', padding: 'var(--space-lg) var(--space-md)', color: '#c0392b' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}

            {!loading && !error && escuelasFiltradas.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-lg) var(--space-md)', color: 'var(--color-dust)', opacity: 0.8 }}>
                <p style={{ margin: 0 }}>
                  {escuelas.length === 0
                    ? 'Todavía no hay escuelas cargadas.'
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
                    href={hrefParaEscuela(e.id)}
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
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-concrete)', marginBottom: '8px' }}>
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
                        Radio {radio} m · {catsSeleccionadas.length} categoría{catsSeleccionadas.length !== 1 ? 's' : ''}
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
