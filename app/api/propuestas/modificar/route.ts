import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

// ── Rate limiting en memoria ──────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10
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
  return str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').replace(/\\/g, '').trim().slice(0, maxLen)
}

// ── Validar coordenadas (Argentina) ───────────────────────────────────────────
function coordsValidas(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) &&
    lat >= -55.2 && lat <= -21.7 &&
    lng >= -73.6 && lng <= -53.6
}

// ── Validar data URI de imagen ────────────────────────────────────────────────
const DATA_URI_REGEX = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
const MAX_FOTO_SIZE = 500 * 1024
const MAX_FOTOS = 3

function validarFotoBase64(dataUri: string): string | null {
  if (!DATA_URI_REGEX.test(dataUri)) return 'Formato de imagen inválido.'
  if (dataUri.length > MAX_FOTO_SIZE) return 'La foto es demasiado grande.'
  return null
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
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

    // 2. Parsear body
    let body: any
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
    }

    // 3. Honeypot
    if (body.sitio_web && body.sitio_web.trim() !== '') {
      return NextResponse.json({ ok: true })
    }

    // 4. Validar baldosaId
    const baldosaId = body.baldosaId
    if (!baldosaId || typeof baldosaId !== 'string') {
      return NextResponse.json({ error: 'ID de baldosa inválido.' }, { status: 400 })
    }

    // 5. Sanitizar campos
    const nombre        = sanitize(body.nombre || '', 200)
    const direccion     = sanitize(body.direccion || '', 300)
    const barrio        = sanitize(body.barrio || '', 100)
    const descripcion   = sanitize(body.descripcion || '', 1000)
    const infoAdicional = sanitize(body.infoAdicional || '', 1000)
    const contacto      = sanitize(body.contacto || '', 200)
    const baldosaCodigo = sanitize(body.baldosaCodigo || '', 20)
    const camposModificados: string[] = Array.isArray(body.camposModificados) ? body.camposModificados : []

    // 6. Validar campos obligatorios
    if (!nombre || nombre.length < 3) {
      return NextResponse.json({ error: 'El nombre es obligatorio (mínimo 3 caracteres).' }, { status: 400 })
    }
    if (!direccion || direccion.length < 5) {
      return NextResponse.json({ error: 'La dirección es obligatoria (mínimo 5 caracteres).' }, { status: 400 })
    }

    // 7. Validar coordenadas
    const latRaw = parseFloat(body.lat)
    const lngRaw = parseFloat(body.lng)
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

    // 8. Validar fotos
    const fotosRaw: string[] = Array.isArray(body.fotos) ? body.fotos : []
    const fotosUrls: string[] = []

    if (fotosRaw.length > MAX_FOTOS) {
      return NextResponse.json({ error: `Máximo ${MAX_FOTOS} fotos permitidas.` }, { status: 400 })
    }
    for (const foto of fotosRaw) {
      if (typeof foto !== 'string') continue
      const err = validarFotoBase64(foto)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
      fotosUrls.push(foto)
    }

    // 9. Conectar y guardar en colección propuestas
    await connectDB()
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos.' }, { status: 500 })
    }

    const propuesta = {
      tipo: 'modificacion',
      estado: 'pendiente',
      baldosaOriginalId: baldosaId,
      baldosaOriginalCodigo: baldosaCodigo,
      camposModificados,
      datos: {
        nombre,
        direccion,
        barrio: barrio || undefined,
        descripcion: descripcion || undefined,
        lat,
        lng,
        fotosUrls: fotosUrls.length > 0 ? fotosUrls : undefined,
      },
      // Info privada para revisión
      notasInternas: [
        contacto ? `Contacto: ${contacto}` : '',
        infoAdicional || '',
        fotosUrls.length > 0 ? `📷 ${fotosUrls.length} foto(s) adjunta(s).` : '',
      ].filter(Boolean).join('\n\n') || undefined,
      ip,
      createdAt: new Date(),
    }

    await db.collection('propuestas').insertOne(propuesta)

    console.log(`✏️ Propuesta de modificación: baldosa ${baldosaCodigo} (${baldosaId}) — campos: ${camposModificados.join(', ') || 'info adicional'}`)

    return NextResponse.json({
      ok: true,
      mensaje: `Corrección para "${nombre}" enviada. Será revisada antes de aplicarse.`,
    })

  } catch (error: any) {
    console.error('Error en POST /api/propuestas/modificar:', error)
    return NextResponse.json({ error: 'Error al guardar la propuesta.' }, { status: 500 })
  }
}
