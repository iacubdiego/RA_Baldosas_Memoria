'use client'

import { useState, useRef, FormEvent, ChangeEvent } from 'react'
import Link from 'next/link'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface FotoPreview {
  dataUri: string   // data:image/jpeg;base64,...
  url: string       // URL.createObjectURL para preview (más liviano que el data URI)
}

// ── Comprimir imagen y devolver como data URI base64 ──────────────────────────
// Redimensiona a max 800px de ancho y comprime a JPG calidad 0.7
// Fotos de celular (~3-5MB) → ~100-200KB en base64
function comprimirABase64(file: File, maxAncho = 800, calidad = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let w = img.width
      let h = img.height

      if (w > maxAncho) {
        h = Math.round((h * maxAncho) / w)
        w = maxAncho
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)

      const dataUri = canvas.toDataURL('image/jpeg', calidad)
      resolve(dataUri)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo procesar la imagen.'))
    }

    img.src = url
  })
}

// ── Estilos reutilizables ─────────────────────────────────────────────────────
const estilos = {
  page: {
    minHeight: 'calc(100vh - 200px)',
    padding: 'var(--space-lg) var(--space-md)',
    background: 'var(--color-parchment)',
  } as React.CSSProperties,

  container: {
    maxWidth: '640px',
    margin: '0 auto',
  } as React.CSSProperties,

  titulo: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
    fontWeight: 700,
    color: 'var(--color-stone)',
    marginBottom: 'var(--space-xs)',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,

  subtitulo: {
    fontSize: '1rem',
    color: 'var(--color-dust)',
    lineHeight: 1.7,
    marginBottom: 'var(--space-lg)',
    maxWidth: '520px',
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--color-stone)',
    marginBottom: '6px',
    letterSpacing: '0.02em',
  } as React.CSSProperties,

  labelOpcional: {
    fontWeight: 400,
    color: 'var(--color-dust)',
    fontSize: '0.8rem',
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '1rem',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-stone)',
    background: '#fff',
    border: '1.5px solid #d1d9e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  } as React.CSSProperties,

  inputFocus: {
    borderColor: 'var(--color-primary)',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  } as React.CSSProperties,

  textarea: {
    resize: 'vertical' as const,
    minHeight: '100px',
  } as React.CSSProperties,

  campo: {
    marginBottom: 'var(--space-md)',
  } as React.CSSProperties,

  fila: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-sm)',
  } as React.CSSProperties,

  botonEnviar: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-parchment)',
    background: 'linear-gradient(135deg, var(--color-stone) 0%, var(--color-concrete) 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    letterSpacing: '0.03em',
    textTransform: 'none' as const,
    boxShadow: '0 4px 16px rgba(26,42,58,0.2)',
    transition: 'all 0.25s ease',
  } as React.CSSProperties,

  botonDeshabilitado: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  } as React.CSSProperties,

  botonUbicar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '0.85rem',
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-primary)',
    background: 'rgba(37, 99, 235, 0.06)',
    border: '1.5px solid rgba(37, 99, 235, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'none' as const,
    letterSpacing: 'normal',
  } as React.CSSProperties,

  error: {
    fontSize: '0.82rem',
    color: '#dc2626',
    marginTop: '4px',
  } as React.CSSProperties,

  honeypot: {
    position: 'absolute' as const,
    left: '-9999px',
    top: '-9999px',
    opacity: 0,
    height: 0,
    width: 0,
    overflow: 'hidden',
    tabIndex: -1,
  } as React.CSSProperties,

  alerta: (tipo: 'ok' | 'error') => ({
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: 'var(--space-md)',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    border: `1.5px solid ${tipo === 'ok' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
    background: tipo === 'ok' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(220, 38, 38, 0.06)',
    color: tipo === 'ok' ? '#065f46' : '#991b1b',
  } as React.CSSProperties),

  separador: {
    border: 'none',
    borderTop: '1px solid rgba(26, 42, 58, 0.08)',
    margin: 'var(--space-md) 0',
  } as React.CSSProperties,

  nota: {
    fontSize: '0.82rem',
    color: 'var(--color-dust)',
    lineHeight: 1.6,
    marginTop: 'var(--space-sm)',
    padding: '12px 14px',
    background: 'rgba(37, 99, 235, 0.03)',
    borderRadius: '8px',
    border: '1px solid rgba(37, 99, 235, 0.08)',
  } as React.CSSProperties,

  avisoCorreccion: {
    padding: '14px 18px',
    borderRadius: '10px',
    marginBottom: 'var(--space-lg)',
    background: 'rgba(99, 102, 241, 0.05)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    fontSize: '0.88rem',
    lineHeight: 1.65,
    color: 'var(--color-concrete)',
  } as React.CSSProperties,

  // ── Estilos de fotos ──
  dropZone: (dragging: boolean) => ({
    border: `2px dashed ${dragging ? 'var(--color-primary)' : '#d1d9e0'}`,
    borderRadius: '12px',
    padding: '24px 16px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: dragging ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
  } as React.CSSProperties),

  fotosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: '12px',
  } as React.CSSProperties,

  fotoThumb: {
    position: 'relative' as const,
    borderRadius: '8px',
    overflow: 'hidden',
    aspectRatio: '1',
    background: '#e5e7eb',
  } as React.CSSProperties,

  fotoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  } as React.CSSProperties,

  fotoRemover: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    lineHeight: 1,
    padding: 0,
    textTransform: 'none' as const,
    letterSpacing: 'normal',
  } as React.CSSProperties,
}

// ── Componente Input con focus styling ────────────────────────────────────────
function Input({
  as = 'input',
  style: extraStyle,
  ...props
}: {
  as?: 'input' | 'textarea'
  [key: string]: any
}) {
  const [focused, setFocused] = useState(false)
  const Tag = as
  return (
    <Tag
      {...props}
      onFocus={(e: any) => { setFocused(true); props.onFocus?.(e) }}
      onBlur={(e: any) => { setFocused(false); props.onBlur?.(e) }}
      style={{
        ...estilos.input,
        ...(as === 'textarea' ? estilos.textarea : {}),
        ...(focused ? estilos.inputFocus : {}),
        ...extraStyle,
      }}
    />
  )
}

const MAX_FOTOS = 3

// ── Página ────────────────────────────────────────────────────────────────────
export default function AgregarBaldosaPage() {
  // Form state
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [barrio, setBarrio] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [contacto, setContacto] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [fotos, setFotos] = useState<FotoPreview[]>([])

  // UI state
  const [enviando, setEnviando] = useState(false)
  const [procesandoFotos, setProcesandoFotos] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [ubicando, setUbicando] = useState(false)
  const [dragging, setDragging] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Manejo de fotos ───────────────────────────────────────────────────────
  async function agregarFotos(archivos: FileList | File[]) {
    const disponibles = MAX_FOTOS - fotos.length
    const errFotos: string[] = []

    if (archivos.length > disponibles) {
      errFotos.push(`Máximo ${MAX_FOTOS} fotos. Se tomaron las primeras ${disponibles}.`)
    }

    const aCargar: File[] = []
    for (let i = 0; i < Math.min(archivos.length, disponibles); i++) {
      const f = archivos[i]

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        errFotos.push(`"${f.name}" no es JPG, PNG o WebP.`)
        continue
      }

      if (f.size > 15 * 1024 * 1024) {
        errFotos.push(`"${f.name}" es demasiado grande (máx. 15 MB).`)
        continue
      }

      aCargar.push(f)
    }

    if (errFotos.length > 0) {
      setErrores(prev => ({ ...prev, fotos: errFotos.join(' ') }))
    } else {
      setErrores(prev => { const { fotos: _, ...rest } = prev; return rest })
    }

    if (aCargar.length === 0) return

    // Comprimir y convertir a base64
    setProcesandoFotos(true)
    try {
      const nuevas: FotoPreview[] = []
      for (const file of aCargar) {
        const dataUri = await comprimirABase64(file)
        nuevas.push({
          dataUri,
          url: URL.createObjectURL(file),
        })
      }
      setFotos(prev => [...prev, ...nuevas])
    } catch {
      setErrores(prev => ({ ...prev, fotos: 'Error al procesar las fotos.' }))
    } finally {
      setProcesandoFotos(false)
    }
  }

  function removerFoto(index: number) {
    setFotos(prev => {
      const copia = [...prev]
      URL.revokeObjectURL(copia[index].url)
      copia.splice(index, 1)
      return copia
    })
    setErrores(prev => { const { fotos: _, ...rest } = prev; return rest })
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      agregarFotos(e.target.files)
    }
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      agregarFotos(e.dataTransfer.files)
    }
  }

  // ── Validación client-side ────────────────────────────────────────────────
  function validar(): boolean {
    const errs: Record<string, string> = {}

    if (!nombre.trim() || nombre.trim().length < 3) {
      errs.nombre = 'Ingresá el nombre (mínimo 3 caracteres).'
    }
    if (!direccion.trim() || direccion.trim().length < 5) {
      errs.direccion = 'Ingresá la dirección (mínimo 5 caracteres).'
    }

    if (lat.trim() || lng.trim()) {
      const latN = parseFloat(lat)
      const lngN = parseFloat(lng)
      if (isNaN(latN) || isNaN(lngN)) {
        errs.coords = 'Las coordenadas deben ser números válidos.'
      } else if (latN < -55.2 || latN > -21.7 || lngN < -73.6 || lngN > -53.6) {
        errs.coords = 'Las coordenadas no corresponden al territorio argentino.'
      }
    }

    if (contacto.trim() && contacto.trim().length < 3) {
      errs.contacto = 'Ingresá un contacto válido.'
    }

    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  // ── Usar geolocalización ──────────────────────────────────────────────────
  function usarMiUbicacion() {
    if (!navigator.geolocation) return
    setUbicando(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
        setUbicando(false)
        setErrores(prev => { const { coords, ...rest } = prev; return rest })
      },
      () => { setUbicando(false) },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  // ── Enviar ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setResultado(null)

    if (!validar()) return

    setEnviando(true)

    try {
      const payload: any = {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        barrio: barrio.trim(),
        descripcion: descripcion.trim(),
        contacto: contacto.trim(),
        sitio_web: honeypot,
      }

      if (lat.trim()) payload.lat = lat.trim()
      if (lng.trim()) payload.lng = lng.trim()

      // Agregar fotos como data URIs base64
      if (fotos.length > 0) {
        payload.fotos = fotos.map(f => f.dataUri)
      }

      const res = await fetch('/api/baldosas/agregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setResultado({ ok: false, mensaje: data.error || 'Error al enviar.' })
      } else {
        setResultado({
          ok: true,
          mensaje: data.mensaje || 'Baldosa registrada. Será revisada antes de aparecer en el mapa.',
        })
        // Limpiar formulario
        setNombre(''); setDireccion(''); setBarrio('')
        setLat(''); setLng(''); setDescripcion('')
        setContacto(''); setErrores({})
        fotos.forEach(f => URL.revokeObjectURL(f.url))
        setFotos([])
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch {
      setResultado({ ok: false, mensaje: 'Error de conexión. Intentá de nuevo.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={estilos.page}>
      <div style={estilos.container} ref={formRef}>

        {/* Encabezado */}
        <h1 style={estilos.titulo}>Agregar una baldosa</h1>
        <p style={estilos.subtitulo}>
          ¿Conocés una baldosa por la memoria que no figura en el mapa?
          Completá este formulario y la vamos a revisar para incorporarla al recorrido.
        </p>

        {/* Aviso para correcciones */}
        <div style={estilos.avisoCorreccion}>
          <strong style={{ color: 'var(--color-stone)' }}>¿Querés corregir o completar datos de una baldosa que ya está en el mapa?</strong>
          {' '}Usá este mismo formulario: indicá el nombre y la dirección de la baldosa existente, y contanos en <em>Información adicional</em> qué dato querés modificar.
        </div>

        {/* Mensaje de resultado */}
        {resultado && (
          <div style={estilos.alerta(resultado.ok ? 'ok' : 'error')}>
            {resultado.ok ? '✅ ' : '⚠️ '}
            {resultado.mensaje}
            {resultado.ok && (
              <div style={{ marginTop: '10px' }}>
                <Link href="/mapa" style={{
                  color: '#065f46',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}>
                  Ir al mapa
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Honeypot (invisible) ── */}
          <div style={estilos.honeypot} aria-hidden="true">
            <label htmlFor="sitio_web">Sitio web</label>
            <input
              type="text"
              id="sitio_web"
              name="sitio_web"
              autoComplete="off"
              tabIndex={-1}
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
            />
          </div>

          {/* Nombre */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="nombre">
              Nombre de la persona homenajeada *
            </label>
            <Input
              id="nombre"
              type="text"
              placeholder="Ej: María Elena Walsh"
              value={nombre}
              onChange={(e: any) => setNombre(e.target.value)}
              maxLength={200}
              required
            />
            {errores.nombre && <p style={estilos.error}>{errores.nombre}</p>}
          </div>

          {/* Dirección */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="direccion">
              Dirección donde está la baldosa *
            </label>
            <Input
              id="direccion"
              type="text"
              placeholder="Ej: Av. de Mayo 1370, CABA"
              value={direccion}
              onChange={(e: any) => setDireccion(e.target.value)}
              maxLength={300}
              required
            />
            {errores.direccion && <p style={estilos.error}>{errores.direccion}</p>}
          </div>

          {/* Barrio */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="barrio">
              Barrio <span style={estilos.labelOpcional}>(opcional)</span>
            </label>
            <Input
              id="barrio"
              type="text"
              placeholder="Ej: San Telmo"
              value={barrio}
              onChange={(e: any) => setBarrio(e.target.value)}
              maxLength={100}
            />
          </div>

          <hr style={estilos.separador} />

          {/* Fotos */}
          <div style={estilos.campo}>
            <label style={estilos.label}>
              Fotos de la baldosa <span style={estilos.labelOpcional}>(opcional — hasta {MAX_FOTOS} fotos, JPG/PNG/WebP)</span>
            </label>

            {/* Drop zone */}
            {fotos.length < MAX_FOTOS && (
              <div
                style={estilos.dropZone(dragging)}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ marginBottom: '6px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-dust)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-dust)', margin: 0 }}>
                  {procesandoFotos
                    ? 'Procesando fotos…'
                    : dragging
                      ? 'Soltá las fotos acá'
                      : 'Tocá para elegir fotos o arrastralas acá'
                  }
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 0' }}>
                  Se comprimen automáticamente antes de enviar
                </p>
              </div>
            )}

            {/* Previews */}
            {fotos.length > 0 && (
              <div style={estilos.fotosGrid}>
                {fotos.map((foto, i) => (
                  <div key={i} style={estilos.fotoThumb}>
                    <img
                      src={foto.url}
                      alt={`Foto ${i + 1}`}
                      style={estilos.fotoImg}
                    />
                    <button
                      type="button"
                      onClick={() => removerFoto(i)}
                      style={estilos.fotoRemover}
                      title="Quitar foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errores.fotos && <p style={estilos.error}>{errores.fotos}</p>}
          </div>

          <hr style={estilos.separador} />

          {/* Coordenadas */}
          <div style={estilos.campo}>
            <label style={estilos.label}>
              Coordenadas <span style={estilos.labelOpcional}>(opcional — ayuda a ubicar la baldosa con precisión)</span>
            </label>

            <div style={{ marginBottom: '10px' }}>
              <button
                type="button"
                onClick={usarMiUbicacion}
                disabled={ubicando}
                style={{
                  ...estilos.botonUbicar,
                  ...(ubicando ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
                {ubicando ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
              </button>
            </div>

            <div style={estilos.fila}>
              <div>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Latitud (ej: -34.6037)"
                  value={lat}
                  onChange={(e: any) => setLat(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Longitud (ej: -58.3816)"
                  value={lng}
                  onChange={(e: any) => setLng(e.target.value)}
                />
              </div>
            </div>
            {errores.coords && <p style={estilos.error}>{errores.coords}</p>}
          </div>

          <hr style={estilos.separador} />

          {/* Descripción */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="descripcion">
              Información adicional <span style={estilos.labelOpcional}>(opcional)</span>
            </label>
            <Input
              as="textarea"
              id="descripcion"
              placeholder="Todo lo que sepas: fecha de colocación, organización que la colocó, historia de la persona…"
              value={descripcion}
              onChange={(e: any) => setDescripcion(e.target.value)}
              maxLength={1000}
            />
          </div>

          {/* Contacto */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="contacto">
              Tu email o contacto <span style={estilos.labelOpcional}>(opcional — por si necesitamos consultarte algo)</span>
            </label>
            <Input
              id="contacto"
              type="text"
              placeholder="Ej: nombre@email.com"
              value={contacto}
              onChange={(e: any) => setContacto(e.target.value)}
              maxLength={200}
            />
            {errores.contacto && <p style={estilos.error}>{errores.contacto}</p>}
          </div>

          {/* Botón enviar */}
          <button
            type="submit"
            disabled={enviando || procesandoFotos}
            style={{
              ...estilos.botonEnviar,
              ...((enviando || procesandoFotos) ? estilos.botonDeshabilitado : {}),
            }}
            onMouseEnter={e => {
              if (!enviando && !procesandoFotos) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(26,42,58,0.3)'
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(26,42,58,0.2)'
            }}
          >
            {procesandoFotos ? 'Procesando fotos…' : enviando ? 'Enviando…' : 'Enviar baldosa'}
          </button>

          <p style={estilos.nota}>
            La baldosa será revisada antes de aparecer en el mapa.
            Solo incorporamos baldosas que correspondan a víctimas de la última
            dictadura cívico-militar y que hayan sido verificadas con fuentes confiables.
          </p>
        </form>
      </div>
    </div>
  )
}
