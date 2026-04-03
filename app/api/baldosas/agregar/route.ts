import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import connectDB from '@/lib/mongodb'
import Baldosa from '@/models/Baldosa'

// ── Configuración ─────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'baldosas')
const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5 MB por archivo
const MAX_FOTOS = 3
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

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

    // 2. Parsear FormData
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { error: 'Datos inválidos.' },
        { status: 400 }
      )
    }

    // 3. Honeypot
    const honeypot = (formData.get('sitio_web') as string) || ''
    if (honeypot.trim() !== '') {
      return NextResponse.json({ ok: true, codigo: 'BALD-0000' })
    }

    // 4. Extraer y sanitizar campos de texto
    const nombre      = sanitize((formData.get('nombre') as string) || '', 200)
    const direccion   = sanitize((formData.get('direccion') as string) || '', 300)
    const barrio      = sanitize((formData.get('barrio') as string) || '', 100)
    const descripcion = sanitize((formData.get('descripcion') as string) || '', 1000)
    const contacto    = sanitize((formData.get('contacto') as string) || '', 200)
    const latRaw      = parseFloat((formData.get('lat') as string) || '')
    const lngRaw      = parseFloat((formData.get('lng') as string) || '')

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

    // 7. Conectar y generar código
    await connectDB()
    const codigo = await proximoCodigo()

    // 8. Procesar fotos
    const fotos = formData.getAll('fotos') as File[]
    const fotosUrls: string[] = []

    if (fotos.length > MAX_FOTOS) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FOTOS} fotos permitidas.` },
        { status: 400 }
      )
    }

    // Crear directorio de uploads si no existe
    await mkdir(UPLOAD_DIR, { recursive: true })

    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i]

      // Ignorar entradas vacías (el input file puede mandar un File vacío)
      if (!foto || !foto.size || foto.size === 0) continue

      // Validar tipo
      if (!TIPOS_PERMITIDOS.includes(foto.type)) {
        return NextResponse.json(
          { error: `Formato no permitido: ${foto.type}. Usá JPG, PNG o WebP.` },
          { status: 400 }
        )
      }

      // Validar tamaño
      if (foto.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `La foto "${foto.name}" supera los 5 MB.` },
          { status: 400 }
        )
      }

      // Generar nombre único: BALD-0042_1_1712345678.jpg
      const ext = foto.type === 'image/png' ? '.png'
                : foto.type === 'image/webp' ? '.webp'
                : '.jpg'
      const filename = `${codigo}_${i + 1}_${Date.now()}${ext}`

      // Guardar en disco
      const bytes = await foto.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filepath = path.join(UPLOAD_DIR, filename)
      await writeFile(filepath, buffer)

      fotosUrls.push(`/uploads/baldosas/${filename}`)
    }

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
