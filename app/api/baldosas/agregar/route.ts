import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

// Mapa de extensiones a content-type
const MIME_TYPES: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // Seguridad: no permitir path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    // Validar que sea una extensión de imagen permitida
    const ext = path.extname(filename).toLowerCase()
    const mimeType = MIME_TYPES[ext]
    if (!mimeType) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    // Leer el archivo desde public/uploads/baldosas/
    const filepath = path.join(process.cwd(), 'public', 'uploads', 'baldosas', filename)

    // Verificar que existe
    try {
      await stat(filepath)
    } catch {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const buffer = await readFile(filepath)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('Error sirviendo imagen:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
