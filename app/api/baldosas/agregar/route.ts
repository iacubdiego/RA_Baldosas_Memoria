import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Baldosa from '@/models/Baldosa'

// ── Rate limiting en memoria ──────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 20
const RATE_WINDOW = 60 * 60 * 1000  // 1 hora

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false

  entry.count++
  return true
}

// ── Sanitización ──────────────────────────────────────────────────────────────
function sanitize(str: string, maxLen = 500): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/\\/g, '')
    .trim()
    .slice(0, maxLen)
}

// ── Validación de coordenadas (Argentina continental) ─────────────────────────
const AR_BOUNDS = {
  latMin: -55.2, latMax: -21.7,
  lngMin: -73.6, lngMax: -53.6,
}

function coordsValidas(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) && !isNaN(lng) &&
    lat >= AR_BOUNDS.latMin && lat <= AR_BOUNDS.latMax &&
    lng >= AR_BOUNDS.lngMin && lng <= AR_BOUNDS.lngMax
  )
}

// ── Validar data URI de imagen ────────────────────────────────────────────────
const DATA_URI_REGEX = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
const MAX_FOTO_SIZE = 500 * 1024  // ~500KB en base64 (≈375KB real)
const MAX_FOTOS = 3

function validarFotoBase64(dataUri: string): string | null {
  if (!DATA_URI_REGEX.test(dataUri)) return 'Formato de imagen inválido.'
  // El tamaño en base64 es ~4/3 del binario. Chequeamos el string directamente.
  if (dataUri.length > MAX_FOTO_SIZE) return 'La foto es demasiado grande.'
  return null
}

// ── Generar próximo código BALD-XXXX ──────────────────────────────────────────
async function proximoCodigo(): Promise<string> {
  const ultimo = await Baldosa
    .findOne({ codigo: /^BALD-\d+$/ })
    .sort({ codigo: -1 })
    .select('codigo')
    .lean() as { codigo: string } | null

  let num = 1
  if (ultimo?.codigo) {
    const match = ultimo.codigo.match(/^BALD-(\d+)$/)
    if (match) num = parseInt(match[1], 10) + 1
  }

  return `BALD-${String(num).padStart(4, '0')}`
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting por IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiados envíos. Intentá de nuevo más tarde.' },
        { status: 429 }
      )
    }

    // 2. Parsear body JSON
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Datos inválidos.' },
        { status: 400 }
      )
    }

    // 3. Honeypot
    if (body.sitio_web && body.sitio_web.trim() !== '') {
      return NextResponse.json({ ok: true, codigo: 'BALD-0000' })
    }

    // 4. Extraer y sanitizar campos de texto
    const nombre      = sanitize(body.nombre || '', 200)
    const direccion   = sanitize(body.direccion || '', 300)
    const barrio      = sanitize(body.barrio || '', 100)
    const descripcion = sanitize(body.descripcion || '', 1000)
    const contacto    = sanitize(body.contacto || '', 200)
    const latRaw      = parseFloat(body.lat)
    const lngRaw      = parseFloat(body.lng)

    // 5. Validar campos obligatorios
    if (!nombre || nombre.length < 3) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio (mínimo 3 caracteres).' },
        { status: 400 }
      )
    }

    if (!direccion || direccion.length < 5) {
      return NextResponse.json(
        { error: 'La dirección es obligatoria (mínimo 5 caracteres).' },
        { status: 400 }
      )
    }

    // 6. Validar coordenadas
    let lat: number | null = null
    let lng: number | null = null

    if (!isNaN(latRaw) && !isNaN(lngRaw)) {
      if (!coordsValidas(latRaw, lngRaw)) {
        return NextResponse.json(
          { error: 'Las coordenadas no corresponden al territorio argentino.' },
          { status: 400 }
        )
      }
      lat = latRaw
      lng = lngRaw
    }

    const finalLat = lat ?? -34.6037
    const finalLng = lng ?? -58.3816

    // 7. Validar fotos (data URIs base64)
    const fotosRaw: string[] = Array.isArray(body.fotos) ? body.fotos : []
    const fotosUrls: string[] = []

    if (fotosRaw.length > MAX_FOTOS) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FOTOS} fotos permitidas.` },
        { status: 400 }
      )
    }

    for (const foto of fotosRaw) {
      if (typeof foto !== 'string') continue
      const err = validarFotoBase64(foto)
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 })
      }
      fotosUrls.push(foto)
    }

    // 8. Conectar y generar código
    await connectDB()
    const codigo = await proximoCodigo()

    // 9. Armar info extendida
    const partes: string[] = []
    if (contacto) partes.push(`Contacto: ${contacto}`)
    if (descripcion) partes.push(descripcion)
    if (!lat || !lng) partes.push('⚠️ Coordenadas no confirmadas — verificar dirección.')
    if (fotosUrls.length > 0) partes.push(`📷 ${fotosUrls.length} foto(s) adjunta(s).`)
    const infoExtendida = partes.join('\n\n') || undefined

    // 10. Insertar con activo: false
    await Baldosa.create({
      codigo,
      nombre,
      descripcion: descripcion || `${nombre} — Baldosa cargada desde el formulario.`,
      categoria: 'historico',
      ubicacion: {
        type: 'Point',
        coordinates: [finalLng, finalLat],
      },
      direccion,
      barrio: barrio || undefined,
      fotosUrls: fotosUrls.length > 0 ? fotosUrls : undefined,
      mensajeAR: `${nombre.toUpperCase()} — PRESENTE`,
      infoExtendida,
      vecesEscaneada: 0,
      activo: false,
    })

    console.log(`✅ Baldosa cargada: ${codigo} — ${nombre} (activo: false, fotos: ${fotosUrls.length})`)

    return NextResponse.json({
      ok: true,
      codigo,
      mensaje: `Baldosa "${nombre}" registrada con código ${codigo}. Será revisada antes de aparecer en el mapa.`,
    })

  } catch (error: any) {
    console.error('Error en POST /api/baldosas/agregar:', error)

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Error interno, intentá de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Error al guardar la baldosa.' },
      { status: 500 }
    )
  }
}
