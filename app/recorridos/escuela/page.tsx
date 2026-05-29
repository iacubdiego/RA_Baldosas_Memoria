'use client'

import { useEffect, useMemo, useState } from 'react'
import EscuelaAnimada from '@/components/EscuelaAnimada'

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

const ESCUELAS_POR_PAGINA = 12

export default function EscuelasIndexPage() {
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(1)

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

  // ── Paginación ──
  const totalPaginas = Math.max(1, Math.ceil(escuelasFiltradas.length / ESCUELAS_POR_PAGINA))
  // Cuando cambia el filtro, volver a la página 1 para no quedar en una vacía
  useEffect(() => { setPagina(1) }, [filtro])
  // Si la página actual queda fuera de rango (porque cambió la lista), corregirla
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas)
  }, [pagina, totalPaginas])

  const escuelasVisibles = useMemo(() => {
    const inicio = (pagina - 1) * ESCUELAS_POR_PAGINA
    return escuelasFiltradas.slice(inicio, inicio + ESCUELAS_POR_PAGINA)
  }, [escuelasFiltradas, pagina])

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
      <style dangerouslySetInnerHTML={{ __html: `
        .ea-hero-fullscreen {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-md);
          /* En desktop: tamaño moderado, deja ver el contenido debajo */
          min-height: 360px;
          margin-bottom: var(--space-md);
        }
        /* En mobile: toma toda la pantalla menos la navbar */
        @media (max-width: 768px) {
          .ea-hero-fullscreen {
            min-height: calc(100dvh - 110px);
            padding: var(--space-sm);
            margin-bottom: var(--space-md);
          }
          /* Chevron sutil que invita a hacer scroll */
          .ea-hero-fullscreen::after {
            content: "";
            position: absolute;
            bottom: 12px;
            left: 50%;
            width: 24px;
            height: 24px;
            border-right: 2px solid var(--color-dust);
            border-bottom: 2px solid var(--color-dust);
            transform: translateX(-50%) rotate(45deg);
            opacity: 0;
            animation: ea-chevron-fade 1.5s ease-out 4.8s forwards, ea-chevron-bounce 2s ease-in-out 4.8s infinite;
          }
        }
        @keyframes ea-chevron-fade {
          from { opacity: 0; }
          to   { opacity: 0.55; }
        }
        @keyframes ea-chevron-bounce {
          0%, 100% { transform: translateX(-50%) rotate(45deg) translateY(0); }
          50%      { transform: translateX(-50%) rotate(45deg) translateY(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ea-hero-fullscreen::after { animation: none !important; opacity: 0.4 !important; }
        }
      ` }} />

      {/* ── HERO: animación de la escuela ────────────────────────────────
        En mobile ocupa casi toda la viewport para que sea lo único visible
        al entrar. En desktop es un hero de tamaño normal con el contenido
        debajo visible sin scroll. */}
      <div className="ea-hero-fullscreen" style={{ position: 'relative' }}>
        <EscuelaAnimada />
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'var(--space-lg) var(--space-md)',
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '900px' }}>

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
                {escuelasVisibles.map(e => (
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

            {/* ── Paginado ── */}
            {!loading && !error && totalPaginas > 1 && (
              <div style={{
                marginTop: 'var(--space-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                color: 'var(--color-dust)',
                fontSize: '0.85rem',
              }}>
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  style={{
                    padding: '8px 14px',
                    border: '1.5px solid ' + (pagina === 1 ? 'rgba(74,107,124,0.15)' : 'rgba(37, 99, 235, 0.25)'),
                    background: pagina === 1 ? 'transparent' : 'rgba(255,255,255,0.85)',
                    color: pagina === 1 ? 'rgba(74,107,124,0.4)' : 'var(--color-primary)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: pagina === 1 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '0.01em',
                    textTransform: 'none',
                  }}
                >
                  ← Anterior
                </button>

                <span style={{
                  padding: '0 12px',
                  fontWeight: 600,
                  color: 'var(--color-stone)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  Página {pagina} de {totalPaginas}
                </span>

                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  style={{
                    padding: '8px 14px',
                    border: '1.5px solid ' + (pagina === totalPaginas ? 'rgba(74,107,124,0.15)' : 'rgba(37, 99, 235, 0.25)'),
                    background: pagina === totalPaginas ? 'transparent' : 'rgba(255,255,255,0.85)',
                    color: pagina === totalPaginas ? 'rgba(74,107,124,0.4)' : 'var(--color-primary)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '0.01em',
                    textTransform: 'none',
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}

            {/* Texto auxiliar bajo el paginado */}
            {!loading && !error && escuelasFiltradas.length > 0 && (
              <div style={{
                textAlign: 'center',
                marginTop: '8px',
                fontSize: '0.75rem',
                color: 'var(--color-dust)',
                opacity: 0.7,
              }}>
                Mostrando {escuelasVisibles.length} de {escuelasFiltradas.length} escuela{escuelasFiltradas.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
