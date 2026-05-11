'use client'

/**
 * /scanner/test — Vista de desarrollo
 *
 * Permite probar la experiencia AR sin estar cerca de la baldosa:
 *   - Click en una baldosa → /scanner/test/[codigo] → AR directa (saltea GPS)
 *   - Con coords forzadas → /scanner/test/[codigo]?lat=X&lng=Y → simula GPS
 *     en esas coordenadas y deja correr el flujo normal de proximidad.
 *
 * Modo test: NO incrementa vecesEscaneada en producción.
 */

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'

interface BaldosaItem {
  id: string
  codigo: string
  nombre: string
  categoria?: string
  direccion?: string
  barrio?: string
  lat: number
  lng: number
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function ScannerTestPage() {
  const [baldosas, setBaldosas]   = useState<BaldosaItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [errorMsg, setErrorMsg]   = useState('')
  const [query, setQuery]         = useState('')
  const [latInput, setLatInput]   = useState('')
  const [lngInput, setLngInput]   = useState('')

  useEffect(() => {
    fetch('/api/baldosas')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.baldosas)) setBaldosas(d.baldosas)
        else setErrorMsg('Respuesta inesperada del API')
      })
      .catch(() => setErrorMsg('No se pudieron cargar las baldosas'))
      .finally(() => setLoading(false))
  }, [])

  const filtradas = useMemo(() => {
    if (query.trim().length < 1) return baldosas
    const q = normalizar(query.trim())
    return baldosas.filter(b =>
      normalizar(b.nombre).includes(q) ||
      normalizar(b.codigo).includes(q) ||
      normalizar(b.direccion ?? '').includes(q) ||
      normalizar(b.barrio ?? '').includes(q)
    )
  }, [query, baldosas])

  const latNum = parseFloat(latInput)
  const lngNum = parseFloat(lngInput)
  const coordsValidas =
    latInput.trim() !== '' && lngInput.trim() !== '' &&
    !isNaN(latNum) && !isNaN(lngNum)

  const queryString = coordsValidas ? `?lat=${latNum}&lng=${lngNum}` : ''
  const linkParaBaldosa = (codigo: string) =>
    `/scanner/test/${encodeURIComponent(codigo)}${queryString}`

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.wrapper}>
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={estilos.chipModoTest}>MODO TEST</div>
          <h1 style={estilos.titulo}>Scanner — Vista de desarrollo</h1>
          <p style={estilos.subtitulo}>
            Elegí una baldosa para ver la AR sin necesidad de estar cerca.
            No se incrementa{' '}
            <code style={estilos.codeInline}>vecesEscaneada</code>.
          </p>
        </div>

        {/* ── Simular GPS ──────────────────────────────────────────────── */}
        <div style={estilos.cardSimular}>
          <div style={estilos.cardSimularTitulo}>
            🧭 Simular coordenadas GPS (opcional)
          </div>
          <p style={estilos.cardSimularDesc}>
            Si completás lat/lng, el scanner usará esas coordenadas en vez
            del GPS real. Útil para testear la fase «caminando» o la
            auto-activación por proximidad.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              inputMode="decimal"
              value={latInput}
              onChange={e => setLatInput(e.target.value)}
              placeholder="lat (-34.6037)"
              style={estilos.input}
            />
            <input
              type="text"
              inputMode="decimal"
              value={lngInput}
              onChange={e => setLngInput(e.target.value)}
              placeholder="lng (-58.3816)"
              style={estilos.input}
            />
            {(latInput || lngInput) && (
              <button
                onClick={() => { setLatInput(''); setLngInput('') }}
                style={estilos.btnLimpiar}
              >
                Limpiar
              </button>
            )}
          </div>
          {coordsValidas && (
            <div style={estilos.confirmacionCoords}>
              ✓ Los enlaces de abajo usarán estas coordenadas.
            </div>
          )}
          {(latInput || lngInput) && !coordsValidas && (
            <div style={estilos.errorCoords}>
              ⚠ Lat/lng deben ser números válidos.
            </div>
          )}
        </div>

        {/* ── Búsqueda ─────────────────────────────────────────────────── */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, código, dirección o barrio…"
          style={{ ...estilos.input, ...estilos.inputBusqueda }}
        />

        <div style={estilos.contador}>
          {loading
            ? 'Cargando baldosas…'
            : errorMsg
              ? <span style={{ color: '#fca5a5' }}>{errorMsg}</span>
              : `${filtradas.length} de ${baldosas.length}`}
        </div>

        {/* ── Lista ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtradas.map(b => (
            <Link
              key={b.id}
              href={linkParaBaldosa(b.codigo)}
              style={estilos.item}
            >
              <div style={estilos.itemFila}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={estilos.itemNombre}>{b.nombre}</div>
                  <div style={estilos.itemDireccion}>
                    {b.direccion ?? '—'}
                    {b.barrio ? ` · ${b.barrio}` : ''}
                  </div>
                </div>
                <div style={estilos.itemCodigo}>{b.codigo}</div>
              </div>
            </Link>
          ))}
          {!loading && !errorMsg && filtradas.length === 0 && (
            <div style={estilos.vacio}>
              No hay baldosas que coincidan con «{query}».
            </div>
          )}
        </div>

        {/* ── Volver ──────────────────────────────────────────────────── */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/mapa" style={estilos.linkVolver}>
            ← Volver al mapa
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos: Record<string, React.CSSProperties> = {
  contenedor: {
    minHeight:   '100vh',
    background:  'var(--color-stone)',
    color:       'var(--color-parchment)',
    padding:     '1.5rem 1rem',
  },
  wrapper: {
    maxWidth: '720px',
    margin:   '0 auto',
  },
  chipModoTest: {
    display:        'inline-block',
    padding:        '0.2rem 0.75rem',
    background:     'rgba(252, 165, 165, 0.15)',
    color:          '#fca5a5',
    borderRadius:   '999px',
    fontSize:       '0.7rem',
    fontWeight:     700,
    letterSpacing:  '0.1em',
    marginBottom:   '0.75rem',
    border:         '1px solid rgba(252, 165, 165, 0.3)',
  },
  titulo: {
    fontFamily: 'var(--font-display)',
    fontSize:   '1.8rem',
    margin:     0,
    color:      'var(--color-parchment)',
  },
  subtitulo: {
    color:      '#90b4ce',
    fontSize:   '0.9rem',
    marginTop:  '0.5rem',
    lineHeight: 1.5,
  },
  codeInline: {
    background:   'rgba(255,255,255,0.08)',
    padding:      '0.1rem 0.35rem',
    borderRadius: '4px',
    fontSize:     '0.85em',
    fontFamily:   'monospace',
  },
  cardSimular: {
    background:    'rgba(37, 99, 235, 0.08)',
    border:        '1px solid rgba(37, 99, 235, 0.25)',
    borderRadius:  '12px',
    padding:       '1rem',
    marginBottom:  '1.5rem',
  },
  cardSimularTitulo: {
    fontSize:       '0.85rem',
    fontWeight:     600,
    color:          '#90b4ce',
    marginBottom:   '0.6rem',
    letterSpacing:  '0.03em',
  },
  cardSimularDesc: {
    fontSize:    '0.8rem',
    color:       'rgba(240,230,211,0.7)',
    margin:      '0 0 0.75rem',
    lineHeight:  1.5,
  },
  input: {
    flex:         1,
    minWidth:     '140px',
    padding:      '0.5rem 0.75rem',
    background:   'rgba(10, 18, 28, 0.6)',
    color:        'var(--color-parchment)',
    border:       '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize:     '0.9rem',
    outline:      'none',
  },
  inputBusqueda: {
    width:        '100%',
    padding:      '0.75rem 1rem',
    fontSize:     '0.95rem',
    marginBottom: '0.75rem',
    flex:         'unset',
  },
  btnLimpiar: {
    padding:      '0.5rem 0.85rem',
    background:   'transparent',
    color:        '#fca5a5',
    border:       '1px solid rgba(252, 165, 165, 0.3)',
    borderRadius: '8px',
    fontSize:     '0.85rem',
    cursor:       'pointer',
  },
  confirmacionCoords: {
    marginTop: '0.6rem',
    fontSize:  '0.75rem',
    color:     '#86efac',
  },
  errorCoords: {
    marginTop: '0.6rem',
    fontSize:  '0.75rem',
    color:     '#fca5a5',
  },
  contador: {
    fontSize:     '0.8rem',
    color:        'rgba(240,230,211,0.55)',
    marginBottom: '0.5rem',
  },
  item: {
    display:        'block',
    padding:        '0.85rem 1rem',
    background:     'rgba(26, 42, 58, 0.6)',
    border:         '1px solid rgba(255,255,255,0.08)',
    borderRadius:   '10px',
    textDecoration: 'none',
    color:          'inherit',
    transition:     'background 0.15s',
  },
  itemFila: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            '0.75rem',
  },
  itemNombre: {
    fontFamily:    'var(--font-display)',
    fontSize:      '1.05rem',
    color:         'var(--color-parchment)',
    marginBottom:  '0.15rem',
  },
  itemDireccion: {
    fontSize: '0.8rem',
    color:    '#90b4ce',
    opacity:  0.85,
  },
  itemCodigo: {
    fontSize:     '0.7rem',
    color:        'rgba(96, 165, 250, 0.85)',
    fontFamily:   'monospace',
    background:   'rgba(37, 99, 235, 0.12)',
    padding:      '0.2rem 0.5rem',
    borderRadius: '6px',
    whiteSpace:   'nowrap',
  },
  vacio: {
    padding:    '2rem',
    textAlign:  'center',
    color:      'rgba(240,230,211,0.5)',
    fontSize:   '0.9rem',
  },
  linkVolver: {
    color:          'rgba(240,230,211,0.55)',
    fontSize:       '0.85rem',
    textDecoration: 'underline',
  },
}
