'use client'

import { useState } from 'react'

interface Propuesta {
  id: string
  nombrePersona: string
  descripcion: string
  lat: number
  lng: number
  direccion?: string
  imagenBase64?: string
}

interface ConvertirModalProps {
  propuesta: Propuesta
  onClose: () => void
  onSuccess: (mensaje: string) => void
}

const CATEGORIAS = [
  { value: 'artista',    label: 'Artista' },
  { value: 'politico',   label: 'Político / Militante' },
  { value: 'historico',  label: 'Histórico' },
  { value: 'deportista', label: 'Deportista' },
  { value: 'cultural',   label: 'Cultural' },
  { value: 'otro',       label: 'Otro' },
]

export default function ConvertirModal({ propuesta, onClose, onSuccess }: ConvertirModalProps) {
  const [codigo,        setCodigo]        = useState('')
  const [categoria,     setCategoria]     = useState('historico')
  const [barrio,        setBarrio]        = useState('')
  const [mensajeAR,     setMensajeAR]     = useState(`${propuesta.nombrePersona.toUpperCase()} - Presente`)
  const [infoExtendida, setInfoExtendida] = useState('')
  const [procesando,    setProcesando]    = useState(false)
  const [error,         setError]         = useState('')

  const handleSubmit = async () => {
    setError('')

    if (!codigo.trim() || codigo.trim().length < 4) {
      setError('El código debe tener al menos 4 caracteres (ej: BALD-0042)')
      return
    }
    if (!mensajeAR.trim() || mensajeAR.trim().length < 5) {
      setError('El mensaje AR es obligatorio')
      return
    }

    setProcesando(true)

    try {
      const res = await fetch(`/api/propuestas/${propuesta.id}/convertir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo:        codigo.trim().toUpperCase(),
          categoria,
          barrio:        barrio.trim() || null,
          mensajeAR:     mensajeAR.trim(),
          infoExtendida: infoExtendida.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear la baldosa')
        return
      }

      onSuccess(`✅ Baldosa ${data.baldosa.codigo} creada. Activa en ubicación GPS ${propuesta.lat.toFixed(5)}, ${propuesta.lng.toFixed(5)}`)
    } catch {
      setError('Error de red al crear la baldosa')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.titulo}>Convertir a Baldosa</h2>
            <p style={s.subtitulo}>{propuesta.nombrePersona}</p>
          </div>
          <button onClick={onClose} style={s.btnCerrar}>✕</button>
        </div>

        {/* Cuerpo */}
        <div style={s.body}>
          {/* Info de la propuesta */}
          <div style={s.infoBox}>
            <p style={s.infoLabel}>📍 Coordenadas GPS (modo location-based)</p>
            <code style={s.codigo}>
              lat: {propuesta.lat.toFixed(6)} · lng: {propuesta.lng.toFixed(6)}
            </code>
            {propuesta.direccion && (
              <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#6b8fa6' }}>
                {propuesta.direccion}
              </p>
            )}
          </div>

          {/* Campos */}
          <div style={s.campo}>
            <label style={s.label}>Código único *</label>
            <input
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej: BALD-0042"
              style={s.input}
              maxLength={20}
            />
            <p style={s.hint}>Identificador único. Recomendado: BALD-NNNN</p>
          </div>

          <div style={s.campo}>
            <label style={s.label}>Categoría *</label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              style={s.input}
            >
              {CATEGORIAS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div style={s.campo}>
            <label style={s.label}>Barrio</label>
            <input
              value={barrio}
              onChange={e => setBarrio(e.target.value)}
              placeholder="Ej: Palermo"
              style={s.input}
            />
          </div>

          <div style={s.campo}>
            <label style={s.label}>Mensaje AR *</label>
            <input
              value={mensajeAR}
              onChange={e => setMensajeAR(e.target.value)}
              placeholder="Texto que aparece en la escena AR"
              style={s.input}
              maxLength={80}
            />
            <p style={s.hint}>Se muestra flotando junto al portaretrato en la escena GPS</p>
          </div>

          <div style={s.campo}>
            <label style={s.label}>Información extendida</label>
            <textarea
              value={infoExtendida}
              onChange={e => setInfoExtendida(e.target.value)}
              placeholder="Texto adicional que aparece en la ficha completa…"
              style={{ ...s.input, height: '90px', resize: 'vertical' }}
              rows={3}
            />
          </div>

          {error && <p style={s.error}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button
            onClick={handleSubmit}
            disabled={procesando}
            style={{ ...s.btnPrimario, opacity: procesando ? 0.7 : 1 }}
          >
            {procesando ? 'Creando baldosa…' : '✓ Crear baldosa location-based'}
          </button>
          <button onClick={onClose} style={s.btnGhost}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    background: '#1a2a3a',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  titulo: {
    color: '#f0e6d3',
    fontSize: '1.2rem',
    fontWeight: 700,
    margin: 0,
  },
  subtitulo: {
    color: '#6b8fa6',
    fontSize: '0.9rem',
    margin: '0.2rem 0 0',
  },
  btnCerrar: {
    background: 'none',
    border: 'none',
    color: '#6b8fa6',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  body: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  infoBox: {
    padding: '0.85rem 1rem',
    background: 'rgba(37, 99, 235, 0.1)',
    border: '1px solid rgba(37, 99, 235, 0.25)',
    borderRadius: '8px',
  },
  infoLabel: {
    color: '#60a5fa',
    fontSize: '0.8rem',
    fontWeight: 600,
    margin: '0 0 0.3rem',
  },
  codigo: {
    display: 'block',
    color: '#90b4ce',
    fontSize: '0.85rem',
    background: 'rgba(0,0,0,0.2)',
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    color: '#90b4ce',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  input: {
    padding: '0.65rem 0.9rem',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: '#f0e6d3',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  hint: {
    color: '#4a6b7c',
    fontSize: '0.78rem',
    margin: 0,
  },
  error: {
    color: '#fca5a5',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: '6px',
    padding: '0.65rem 1rem',
    fontSize: '0.9rem',
    margin: 0,
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  btnPrimario: {
    padding: '0.85rem',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGhost: {
    padding: '0.75rem',
    background: 'transparent',
    color: '#6b8fa6',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
}
