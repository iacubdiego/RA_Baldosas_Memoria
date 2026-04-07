'use client'

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface FotoPreview {
  dataUri: string
  url: string
}

interface BaldosaOriginal {
  id: string
  codigo: string
  nombre: string
  direccion: string
  barrio: string
  lat: number
  lng: number
  descripcion?: string
  infoExtendida?: string
}

// ── Comprimir imagen ──────────────────────────────────────────────────────────
function comprimirABase64(file: File, maxAncho = 800, calidad = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.width, h = img.height
      if (w > maxAncho) { h = Math.round((h * maxAncho) / w); w = maxAncho }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', calidad))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo procesar la imagen.')) }
    img.src = url
  })
}

// ── Estilos (reutilizados del formulario de agregar) ─────────────────────────
const estilos = {
  page: {
    minHeight: 'calc(100vh - 200px)',
    padding: 'var(--space-lg) var(--space-md)',
    background: 'var(--color-parchment)',
  } as React.CSSProperties,
  container: { maxWidth: '640px', margin: '0 auto' } as React.CSSProperties,
  titulo: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
    fontWeight: 700, color: 'var(--color-stone)', marginBottom: 'var(--space-xs)',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  subtitulo: {
    fontSize: '1rem', color: 'var(--color-dust)', lineHeight: 1.7,
    marginBottom: 'var(--space-lg)', maxWidth: '520px',
  } as React.CSSProperties,
  label: {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
    fontWeight: 600, color: 'var(--color-stone)', marginBottom: '6px',
    letterSpacing: '0.02em',
  } as React.CSSProperties,
  labelOpcional: { fontWeight: 400, color: 'var(--color-dust)', fontSize: '0.8rem' } as React.CSSProperties,
  input: {
    width: '100%', padding: '12px 14px', fontSize: '1rem',
    fontFamily: 'var(--font-body)', color: 'var(--color-stone)',
    background: '#fff', border: '1.5px solid #d1d9e0', borderRadius: '10px',
    outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  } as React.CSSProperties,
  inputFocus: {
    borderColor: 'var(--color-primary)', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  } as React.CSSProperties,
  textarea: { resize: 'vertical' as const, minHeight: '100px' } as React.CSSProperties,
  campo: { marginBottom: 'var(--space-md)' } as React.CSSProperties,
  fila: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' } as React.CSSProperties,
  botonEnviar: {
    width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700,
    fontFamily: 'var(--font-body)', color: 'var(--color-parchment)',
    background: 'linear-gradient(135deg, var(--color-stone) 0%, var(--color-concrete) 100%)',
    border: 'none', borderRadius: '12px', cursor: 'pointer',
    letterSpacing: '0.03em', textTransform: 'none' as const,
    boxShadow: '0 4px 16px rgba(26,42,58,0.2)', transition: 'all 0.25s ease',
  } as React.CSSProperties,
  botonDeshabilitado: { opacity: 0.6, cursor: 'not-allowed', transform: 'none' } as React.CSSProperties,
  error: { fontSize: '0.82rem', color: '#dc2626', marginTop: '4px' } as React.CSSProperties,
  honeypot: {
    position: 'absolute' as const, left: '-9999px', top: '-9999px',
    opacity: 0, height: 0, width: 0, overflow: 'hidden', tabIndex: -1,
  } as React.CSSProperties,
  alerta: (tipo: 'ok' | 'error') => ({
    padding: '16px 20px', borderRadius: '12px', marginBottom: 'var(--space-md)',
    fontSize: '0.95rem', lineHeight: 1.6,
    border: `1.5px solid ${tipo === 'ok' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
    background: tipo === 'ok' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(220, 38, 38, 0.06)',
    color: tipo === 'ok' ? '#065f46' : '#991b1b',
  } as React.CSSProperties),
  separador: { border: 'none', borderTop: '1px solid rgba(26, 42, 58, 0.08)', margin: 'var(--space-md) 0' } as React.CSSProperties,
  nota: {
    fontSize: '0.82rem', color: 'var(--color-dust)', lineHeight: 1.6,
    marginTop: 'var(--space-sm)', padding: '12px 14px',
    background: 'rgba(37, 99, 235, 0.03)', borderRadius: '8px',
    border: '1px solid rgba(37, 99, 235, 0.08)',
  } as React.CSSProperties,
  chipOriginal: {
    display: 'inline-block', fontSize: '0.75rem', color: 'var(--color-dust)',
    background: 'rgba(37, 99, 235, 0.06)', border: '1px solid rgba(37, 99, 235, 0.12)',
    borderRadius: '6px', padding: '2px 8px', marginTop: '4px',
  } as React.CSSProperties,
  dropZone: (dragging: boolean) => ({
    border: `2px dashed ${dragging ? 'var(--color-primary)' : '#d1d9e0'}`,
    borderRadius: '12px', padding: '24px 16px', textAlign: 'center' as const,
    cursor: 'pointer', transition: 'all 0.2s ease',
    background: dragging ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
  } as React.CSSProperties),
  fotosGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' } as React.CSSProperties,
  fotoThumb: { position: 'relative' as const, borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: '#e5e7eb' } as React.CSSProperties,
  fotoImg: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' } as React.CSSProperties,
  fotoRemover: {
    position: 'absolute' as const, top: '4px', right: '4px', width: '24px', height: '24px',
    borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', lineHeight: 1, padding: 0, textTransform: 'none' as const, letterSpacing: 'normal',
  } as React.CSSProperties,
}

// ── Input con focus styling ──────────────────────────────────────────────────
function Input({ as = 'input', style: extraStyle, ...props }: { as?: 'input' | 'textarea'; [key: string]: any }) {
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
export default function ModificarBaldosaPage() {
  const params = useParams()
  const baldosaId = params.id as string

  // Datos originales de la baldosa
  const [original, setOriginal] = useState<BaldosaOriginal | null>(null)
  const [loadingOriginal, setLoadingOriginal] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  // Form state
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [barrio, setBarrio] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [infoAdicional, setInfoAdicional] = useState('')
  const [contacto, setContacto] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [fotos, setFotos] = useState<FotoPreview[]>([])

  // UI state
  const [enviando, setEnviando] = useState(false)
  const [procesandoFotos, setProcesandoFotos] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [dragging, setDragging] = useState(false)
  const [mostrarPopup, setMostrarPopup] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Cargar datos originales de la baldosa ──────────────────────────────────
  useEffect(() => {
    if (!baldosaId) return
    setLoadingOriginal(true)
    fetch(`/api/baldosas/${baldosaId}`)
      .then(r => {
        if (!r.ok) throw new Error('No encontrada')
        return r.json()
      })
      .then(data => {
        const b = data.baldosa
        const orig: BaldosaOriginal = {
          id: b.id,
          codigo: b.codigo,
          nombre: b.nombre,
          direccion: b.direccion || '',
          barrio: b.barrio || '',
          lat: b.lat,
          lng: b.lng,
          descripcion: b.descripcion || '',
          infoExtendida: b.infoExtendida || '',
        }
        setOriginal(orig)
        // Precargar formulario
        setNombre(orig.nombre)
        setDireccion(orig.direccion)
        setBarrio(orig.barrio)
        setLat(String(orig.lat))
        setLng(String(orig.lng))
        setDescripcion(orig.descripcion || '')
      })
      .catch(() => setErrorCarga('No se pudo cargar la baldosa. Verificá que el enlace sea correcto.'))
      .finally(() => setLoadingOriginal(false))
  }, [baldosaId])

  // ── Detectar campos modificados ───────────────────────────────────────────
  function camposModificados(): string[] {
    if (!original) return []
    const cambios: string[] = []
    if (nombre.trim() !== original.nombre) cambios.push('nombre')
    if (direccion.trim() !== original.direccion) cambios.push('direccion')
    if (barrio.trim() !== original.barrio) cambios.push('barrio')
    if (lat.trim() !== String(original.lat) || lng.trim() !== String(original.lng)) cambios.push('coordenadas')
    if (descripcion.trim() !== (original.descripcion || '')) cambios.push('descripcion')
    if (fotos.length > 0) cambios.push('fotos')
    return cambios
  }

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
        errFotos.push(`"${f.name}" no es JPG, PNG o WebP.`); continue
      }
      if (f.size > 15 * 1024 * 1024) {
        errFotos.push(`"${f.name}" es demasiado grande (máx. 15 MB).`); continue
      }
      aCargar.push(f)
    }
    if (errFotos.length > 0) setErrores(prev => ({ ...prev, fotos: errFotos.join(' ') }))
    else setErrores(prev => { const { fotos: _, ...rest } = prev; return rest })
    if (aCargar.length === 0) return
    setProcesandoFotos(true)
    try {
      const nuevas: FotoPreview[] = []
      for (const file of aCargar) {
        const dataUri = await comprimirABase64(file)
        nuevas.push({ dataUri, url: URL.createObjectURL(file) })
      }
      setFotos(prev => [...prev, ...nuevas])
    } catch { setErrores(prev => ({ ...prev, fotos: 'Error al procesar las fotos.' })) }
    finally { setProcesandoFotos(false) }
  }

  function removerFoto(index: number) {
    setFotos(prev => { const c = [...prev]; URL.revokeObjectURL(c[index].url); c.splice(index, 1); return c })
    setErrores(prev => { const { fotos: _, ...rest } = prev; return rest })
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) agregarFotos(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files.length > 0) agregarFotos(e.dataTransfer.files)
  }

  // ── Validación ────────────────────────────────────────────────────────────
  function validar(): boolean {
    const errs: Record<string, string> = {}
    if (!nombre.trim() || nombre.trim().length < 3) errs.nombre = 'El nombre es obligatorio (mínimo 3 caracteres).'
    if (!direccion.trim() || direccion.trim().length < 5) errs.direccion = 'La dirección es obligatoria (mínimo 5 caracteres).'
    if (lat.trim() || lng.trim()) {
      const latN = parseFloat(lat), lngN = parseFloat(lng)
      if (isNaN(latN) || isNaN(lngN)) errs.coords = 'Las coordenadas deben ser números válidos.'
      else if (latN < -55.2 || latN > -21.7 || lngN < -73.6 || lngN > -53.6) errs.coords = 'Las coordenadas no corresponden al territorio argentino.'
    }
    if (contacto.trim() && contacto.trim().length < 3) errs.contacto = 'Ingresá un contacto válido.'

    const modificados = camposModificados()
    if (modificados.length === 0 && !infoAdicional.trim()) {
      errs.general = 'No se detectaron cambios. Modificá al menos un campo o agregá información adicional.'
    }

    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  // ── Enviar ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setResultado(null)
    if (!validar()) return
    setEnviando(true)

    try {
      const payload: any = {
        baldosaId,
        baldosaCodigo: original?.codigo,
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        barrio: barrio.trim(),
        descripcion: descripcion.trim(),
        infoAdicional: infoAdicional.trim(),
        contacto: contacto.trim(),
        sitio_web: honeypot,
        camposModificados: camposModificados(),
      }
      if (lat.trim()) payload.lat = lat.trim()
      if (lng.trim()) payload.lng = lng.trim()
      if (fotos.length > 0) payload.fotos = fotos.map(f => f.dataUri)

      const res = await fetch('/api/propuestas/modificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setResultado({ ok: false, mensaje: data.error || 'Error al enviar.' })
      } else {
        setResultado({ ok: true, mensaje: data.mensaje || 'Propuesta enviada.' })
        setMostrarPopup(true)
        setInfoAdicional(''); setContacto(''); setErrores({})
        fotos.forEach(f => URL.revokeObjectURL(f.url)); setFotos([])
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch {
      setResultado({ ok: false, mensaje: 'Error de conexión. Intentá de nuevo.' })
    } finally {
      setEnviando(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingOriginal) {
    return (
      <div style={estilos.page}>
        <div style={{ ...estilos.container, textAlign: 'center', paddingTop: '4rem' }}>
          <p style={{ color: 'var(--color-dust)', fontSize: '1rem' }}>Cargando datos de la baldosa…</p>
        </div>
      </div>
    )
  }

  if (errorCarga || !original) {
    return (
      <div style={estilos.page}>
        <div style={estilos.container}>
          <h1 style={estilos.titulo}>Baldosa no encontrada</h1>
          <p style={{ color: 'var(--color-dust)', marginBottom: 'var(--space-md)' }}>
            {errorCarga || 'No se pudo cargar la baldosa.'}
          </p>
          <Link href="/mapa" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>
            Volver al mapa
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={estilos.page}>
      <div style={estilos.container} ref={formRef}>

        <h1 style={estilos.titulo}>Sugerir corrección</h1>
        <p style={estilos.subtitulo}>
          Modificá los datos que necesiten corrección para <strong>{original.nombre}</strong>.
          Tu propuesta será revisada antes de aplicarse.
        </p>

        {/* Info de la baldosa original */}
        <div style={{
          padding: '14px 18px', borderRadius: '10px', marginBottom: 'var(--space-lg)',
          background: 'rgba(37, 99, 235, 0.04)', border: '1px solid rgba(37, 99, 235, 0.12)',
        }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-stone)', margin: 0, fontWeight: 600 }}>
            {original.nombre}
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-dust)', margin: '2px 0 0' }}>
            {original.direccion}{original.barrio ? ` · ${original.barrio}` : ''}
          </p>
        </div>

        {/* Mensaje de resultado */}
        {resultado && (
          <div style={estilos.alerta(resultado.ok ? 'ok' : 'error')}>
            {resultado.ok ? '✅ ' : '⚠️ '}{resultado.mensaje}
          </div>
        )}

        {errores.general && (
          <div style={estilos.alerta('error')}>⚠️ {errores.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Honeypot */}
          <div style={estilos.honeypot} aria-hidden="true">
            <label htmlFor="sitio_web">Sitio web</label>
            <input type="text" id="sitio_web" name="sitio_web" autoComplete="off" tabIndex={-1}
              value={honeypot} onChange={e => setHoneypot(e.target.value)} />
          </div>

          {/* Nombre */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="nombre">Nombre de la persona homenajeada *</label>
            <Input id="nombre" type="text" value={nombre}
              onChange={(e: any) => setNombre(e.target.value)} maxLength={200} required />
            {nombre.trim() !== original.nombre && (
              <span style={estilos.chipOriginal}>Original: {original.nombre}</span>
            )}
            {errores.nombre && <p style={estilos.error}>{errores.nombre}</p>}
          </div>

          {/* Dirección */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="direccion">Dirección donde está la baldosa *</label>
            <Input id="direccion" type="text" value={direccion}
              onChange={(e: any) => setDireccion(e.target.value)} maxLength={300} required />
            {direccion.trim() !== original.direccion && original.direccion && (
              <span style={estilos.chipOriginal}>Original: {original.direccion}</span>
            )}
            {errores.direccion && <p style={estilos.error}>{errores.direccion}</p>}
          </div>

          {/* Barrio */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="barrio">
              Barrio <span style={estilos.labelOpcional}>(opcional)</span>
            </label>
            <Input id="barrio" type="text" value={barrio}
              onChange={(e: any) => setBarrio(e.target.value)} maxLength={100} />
            {barrio.trim() !== original.barrio && original.barrio && (
              <span style={estilos.chipOriginal}>Original: {original.barrio}</span>
            )}
          </div>

          <hr style={estilos.separador} />

          {/* Fotos */}
          <div style={estilos.campo}>
            <label style={estilos.label}>
              Agregar fotos <span style={estilos.labelOpcional}>(opcional — hasta {MAX_FOTOS} fotos nuevas)</span>
            </label>
            {fotos.length < MAX_FOTOS && (
              <div style={estilos.dropZone(dragging)}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                  multiple onChange={handleFileChange} style={{ display: 'none' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--color-dust)', margin: 0 }}>
                  {procesandoFotos ? 'Procesando fotos…' : dragging ? 'Soltá las fotos acá' : 'Tocá para elegir fotos o arrastralas acá'}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 0' }}>
                  Se comprimen automáticamente antes de enviar
                </p>
              </div>
            )}
            {fotos.length > 0 && (
              <div style={estilos.fotosGrid}>
                {fotos.map((foto, i) => (
                  <div key={i} style={estilos.fotoThumb}>
                    <img src={foto.url} alt={`Foto ${i + 1}`} style={estilos.fotoImg} />
                    <button type="button" onClick={() => removerFoto(i)} style={estilos.fotoRemover} title="Quitar foto">✕</button>
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
              Coordenadas <span style={estilos.labelOpcional}>(modificá solo si la ubicación actual es incorrecta)</span>
            </label>
            <div style={estilos.fila}>
              <div>
                <Input type="text" inputMode="decimal" placeholder="Latitud"
                  value={lat} onChange={(e: any) => setLat(e.target.value)} />
              </div>
              <div>
                <Input type="text" inputMode="decimal" placeholder="Longitud"
                  value={lng} onChange={(e: any) => setLng(e.target.value)} />
              </div>
            </div>
            {errores.coords && <p style={estilos.error}>{errores.coords}</p>}
          </div>

          <hr style={estilos.separador} />

          {/* Descripción */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="descripcion">
              Descripción <span style={estilos.labelOpcional}>(pública — se mostrará en el detalle)</span>
            </label>
            <Input as="textarea" id="descripcion" placeholder="Historia, fecha de colocación, organización…"
              value={descripcion} onChange={(e: any) => setDescripcion(e.target.value)} maxLength={1000} />
          </div>

          <hr style={estilos.separador} />

          {/* Info adicional (privada) */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="infoAdicional">
              Motivo de la corrección <span style={estilos.labelOpcional}>(no se publica — nos ayuda a verificar)</span>
            </label>
            <Input as="textarea" id="infoAdicional"
              placeholder="Explicá qué dato está incorrecto y cuál sería el correcto. Si tenés fuentes, incluílas acá."
              value={infoAdicional} onChange={(e: any) => setInfoAdicional(e.target.value)} maxLength={1000} />
          </div>

          {/* Contacto */}
          <div style={estilos.campo}>
            <label style={estilos.label} htmlFor="contacto">
              Tu email o contacto <span style={estilos.labelOpcional}>(opcional — por si necesitamos consultarte)</span>
            </label>
            <Input id="contacto" type="text" placeholder="Ej: nombre@email.com"
              value={contacto} onChange={(e: any) => setContacto(e.target.value)} maxLength={200} />
            {errores.contacto && <p style={estilos.error}>{errores.contacto}</p>}
          </div>

          {/* Enviar */}
          <button type="submit" disabled={enviando || procesandoFotos}
            style={{ ...estilos.botonEnviar, ...((enviando || procesandoFotos) ? estilos.botonDeshabilitado : {}) }}
          >
            {procesandoFotos ? 'Procesando fotos…' : enviando ? 'Enviando…' : 'Enviar corrección'}
          </button>

          <p style={estilos.nota}>
            Tu propuesta será revisada antes de aplicarse.
            Solo incorporamos cambios verificados con fuentes confiables.
          </p>
        </form>
      </div>

      {/* ── Popup de éxito ── */}
      {mostrarPopup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(10, 18, 28, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', animation: 'fadeIn 0.3s ease',
        }} onClick={() => setMostrarPopup(false)}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '2rem 2rem 1.5rem',
            maxWidth: '380px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            textAlign: 'center', animation: 'slideUpFade 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-stone)', margin: '0 0 0.5rem' }}>
              ¡Corrección enviada!
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-dust)', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              Gracias por colaborar. Tu propuesta será revisada antes de aplicarse.
            </p>
            <Link href="/mapa" style={{
              display: 'block', padding: '11px', fontSize: '0.9rem', fontWeight: 600,
              fontFamily: 'var(--font-body)', color: 'var(--color-parchment)',
              background: 'var(--color-stone)', border: 'none', borderRadius: '10px',
              textAlign: 'center', textDecoration: 'none',
            }}>
              Volver al mapa
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
