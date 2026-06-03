/**
 * GET /api/escuelas/[id]/pdf?radio=500
 *
 * Genera un PDF con:
 *   - Portada: encabezado de la escuela, mapa estático del entorno y un
 *     índice de las baldosas incluidas.
 *   - Una página por baldosa: nombre, código, dirección, descripción,
 *     infoExtendida y hasta 3 fotos.
 *   - Footer con datos del proyecto y QR dinámico apuntando al recorrido.
 *
 * Las baldosas se ordenan por distancia desde la escuela y se cortan a 20.
 *
 * Dependencias: pdfkit, sharp, qrcode.
 *   npm install pdfkit sharp qrcode
 *   npm install -D @types/pdfkit @types/qrcode
 */

import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import sharp from 'sharp'
import QRCode from 'qrcode'
import path from 'path'
import fs from 'fs'

import connectDB from '@/lib/mongodb'
import Escuela from '@/models/Escuela'
import Baldosa from '@/models/Baldosa'
import { generarMapaEstaticoIGN } from '@/lib/staticMapIGN'

// ─── Configuración del PDF ────────────────────────────────────────────────
const PAGE_W = 595   // A4 ancho en puntos
const PAGE_H = 842   // A4 alto en puntos
const MARGIN = 40
const CONTENT_W = PAGE_W - MARGIN * 2

const MAX_BALDOSAS = 20
const MAX_FOTOS = 3
const FOTO_TARGET_W = 400   // ancho destino tras resize (px)
const FOTO_JPEG_Q = 75
const MAX_DESC_CHARS = 600
const MAX_INFO_EXT_CHARS = 600

// Colores (paleta del proyecto)
const C_STONE = '#1a2a3a'
const C_CONCRETE = '#2d4a5e'
const C_DUST = '#4a6b7c'
const C_PRIMARY = '#2563eb'
const C_PARCHMENT = '#f0f4f8'

// ─── Util: distancia haversine ────────────────────────────────────────────
function distancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function truncar(s: string | undefined, max: number): string {
  if (!s) return ''
  return s.length > max ? s.substring(0, max - 1).trimEnd() + '…' : s
}

function formatFecha(d: Date): string {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ─── Lectura de assets del proyecto ───────────────────────────────────────
function leerLogo(): Buffer | null {
  const p = path.join(process.cwd(), 'public', 'images', 'logo_flores.png')
  try { return fs.readFileSync(p) } catch { return null }
}

// ─── Procesar fotos ───────────────────────────────────────────────────────
/**
 * Procesa una foto (data URI o URL):
 *   - Resize a FOTO_TARGET_W de ancho máximo (con respeto al EXIF).
 *   - Recorte a proporción 4:3 (cover) para que todas las fotos del PDF
 *     queden con la misma forma exacta y se acomoden lado a lado sin huecos.
 *   - Reencode como JPEG calidad FOTO_JPEG_Q.
 *
 * Trade-off: el crop puede cortar bordes de fotos muy verticales o muy
 * horizontales. Para baldosas memoriales, donde el contenido suele estar
 * centrado, es un compromiso razonable a cambio de un layout uniforme.
 *
 * Devuelve null si falla.
 */
async function procesarFoto(src: string): Promise<Buffer | null> {
  try {
    let input: Buffer
    if (src.startsWith('data:')) {
      const base64 = src.split(',')[1]
      if (!base64) return null
      input = Buffer.from(base64, 'base64')
    } else if (src.startsWith('http')) {
      const res = await fetch(src, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) return null
      input = Buffer.from(await res.arrayBuffer())
    } else {
      return null
    }

    // Calcular altura 4:3 a partir del ancho destino
    const targetW = FOTO_TARGET_W
    const targetH = Math.round((targetW * 3) / 4)

    return await sharp(input)
      .rotate() // respeta EXIF
      .resize({
        width: targetW,
        height: targetH,
        fit: 'cover',     // recorta para llenar el área sin distorsionar
        position: 'attention', // intenta priorizar la zona "interesante" de la foto
      })
      .jpeg({ quality: FOTO_JPEG_Q })
      .toBuffer()
  } catch (e) {
    console.warn('[pdf] No se pudo procesar foto:', e)
    return null
  }
}

// ─── Render: footer final (solo en la última página, estilo web) ──────────
/**
 * Footer al estilo de la web: fondo oscuro (--color-stone) con logo +
 * nombre del proyecto, lista de organizaciones de memoria, y créditos a
 * gcoop y malefico3d.
 *
 * El footer ocupa aproximadamente 200pt de alto. Si no entra en la página
 * actual, el caller debe agregar una página nueva antes de llamarlo.
 *
 * @param y donde arranca verticalmente el footer
 */
function renderFooterFinal(doc: PDFKit.PDFDocument, logo: Buffer | null, y: number) {
  const FOOTER_H = 200
  const PAD_X = 32
  const PAD_TOP = 22

  // Banda oscura de fondo, full-width (de borde a borde de la hoja)
  doc.save()
  doc.rect(0, y, PAGE_W, FOOTER_H).fill(C_STONE)
  // Línea azul superior del footer (como en la web)
  doc.rect(0, y, PAGE_W, 2).fill(C_PRIMARY)
  doc.restore()

  // ── Columna izquierda: logo + nombre del proyecto ──
  // El ancho total de esta columna es 175pt (de PAD_X=32 hasta X=207).
  // La columna central empieza en X=220, dejando 13pt de aire.
  let yCol = y + PAD_TOP
  if (logo) {
    doc.image(logo, PAD_X, yCol, { width: 44, height: 44 })
  }
  // "Recorremos Memoria" — ancho acotado para que no se monte sobre la columna central
  doc.font('Helvetica-Bold').fontSize(12).fillColor(C_PARCHMENT)
    .text('Recorremos Memoria', PAD_X + (logo ? 52 : 0), yCol + 8, {
      width: 120, lineBreak: true,
    })

  // Web (debajo del nombre)
  doc.font('Helvetica').fontSize(7.5).fillColor('#a8b3bd')
    .text('recorremosmemoria.com.ar', PAD_X + (logo ? 52 : 0), yCol + 36, {
      width: 120, lineBreak: false,
    })

  // ── Columna central: organizaciones ──
  const colCentralX = 220
  const colCentralW = 200
  const yCentral = y + PAD_TOP

  doc.font('Helvetica-Bold').fontSize(7).fillColor('#d4d8dc')
    .text('UN APORTE DE GCOOP A LA CAMPAÑA', colCentralX, yCentral, {
      width: colCentralW, lineBreak: false, characterSpacing: 0.8,
    })
  doc.text('PARA ABRAZAR LA MEMORIA DE:', colCentralX, yCentral + 10, {
    width: colCentralW, lineBreak: false, characterSpacing: 0.8,
  })

  doc.font('Helvetica').fontSize(8).fillColor('#a8b3bd')
  const organizaciones = [
    'Madres de Plaza de Mayo Línea Fundadora',
    'Abuelas de Plaza de Mayo',
    'H.I.J.O.S. Capital',
    'Familiares de Desaparecidos',
    'CELS',
  ]
  let yOrg = yCentral + 28
  for (const org of organizaciones) {
    doc.text(org, colCentralX, yOrg, { width: colCentralW, lineBreak: false })
    yOrg += 13
  }

  // ── Columna derecha: créditos ──
  const colDerX = PAGE_W - PAD_X - 130
  const yDer = y + PAD_TOP + 20

  // gcoop
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#bcc4cc')
    .text('gcoop', colDerX, yDer, { width: 130, lineBreak: false, align: 'right' })

  // Línea separadora
  doc.font('Helvetica').fontSize(13).fillColor('#5a6770')
    .text('+', colDerX, yDer + 22, { width: 130, lineBreak: false, align: 'right' })

  // "Animación por"
  doc.font('Helvetica').fontSize(7).fillColor('#7a8590')
    .text('ANIMACIÓN POR', colDerX, yDer + 44, {
      width: 130, lineBreak: false, align: 'right', characterSpacing: 1,
    })

  // malefico3d
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#bcc4cc')
    .text('malefico3d', colDerX, yDer + 54, {
      width: 130, lineBreak: false, align: 'right',
    })
}

// ─── Endpoint ─────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB()

    const radio = Math.max(50, Math.min(5000, Number(req.nextUrl.searchParams.get('radio')) || 500))

    // Escuela
    const escuela: any = await Escuela.findById(params.id).lean()
    if (!escuela) {
      return NextResponse.json({ error: 'Escuela no encontrada' }, { status: 404 })
    }
    const [eLng, eLat] = escuela.ubicacion?.coordinates ?? [escuela.lng, escuela.lat]

    // Baldosas dentro del radio (consulta geoespacial — igual que las que el
    // mapa carga desde /api/baldosas/pins y filtra por radio del lado del cliente).
    const baldosasCrudas: any[] = await Baldosa.find({
      activo: true,
      ubicacion: {
        $geoWithin: {
          $centerSphere: [[eLng, eLat], radio / 6378137], // radio en radianes
        },
      },
    }).lean()

    // Distancia + orden + corte a 20
    const baldosasConDist = baldosasCrudas
      .map(b => {
        const [lng, lat] = b.ubicacion.coordinates
        return { ...b, lat, lng, dist: distancia(eLat, eLng, lat, lng) }
      })
      .sort((a, b) => a.dist - b.dist)

    const totalEnRadio = baldosasConDist.length
    const baldosas = baldosasConDist.slice(0, MAX_BALDOSAS)
    const truncado = totalEnRadio > MAX_BALDOSAS

    // ── Generación en paralelo de lo que no depende del PDF ──
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://recorremosmemoria.com.ar'
    const recorridoUrl = `${siteUrl}/recorridos/escuela/${params.id}?radio=${radio}`

    const [mapaBuf, qrBuf, ...fotosProcesadas] = await Promise.all([
      generarMapaEstaticoIGN({
        centerLat: eLat,
        centerLng: eLng,
        radio,
        width: 1000,
        height: 500,
        markers: [
          { lat: eLat, lng: eLng, tipo: 'escuela' },
          ...baldosas.map(b => ({ lat: b.lat, lng: b.lng, tipo: 'baldosa' as const })),
        ],
      }),
      QRCode.toBuffer(recorridoUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#1a2a3a', light: '#ffffff' },
      }),
      // Procesar hasta 3 fotos por baldosa
      ...baldosas.flatMap(b =>
        (b.fotosUrls || []).slice(0, MAX_FOTOS).map(procesarFoto)
      ),
    ])

    // Asociar fotos procesadas con cada baldosa
    let fotoIdx = 0
    const baldosasConFotos = baldosas.map(b => {
      const totalFotos = Math.min((b.fotosUrls || []).length, MAX_FOTOS)
      const fotos = (fotosProcesadas as (Buffer | null)[])
        .slice(fotoIdx, fotoIdx + totalFotos)
        .filter((f): f is Buffer => f !== null)
      fotoIdx += totalFotos
      return { ...b, fotosProcesadas: fotos }
    })

    // ── Generar PDF ──
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      bufferPages: true,
      info: {
        Title: `Recorrido - ${escuela.nombre}`,
        Author: 'Recorremos Memoria',
        Subject: 'Recorrido por baldosas de la memoria',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    const donePromise = new Promise<Buffer>(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
    })

    // ═══ PÁGINA 1: PORTADA ═══════════════════════════════════════════════
    const logo = leerLogo()
    const meta = [escuela.direccion, escuela.barrio].filter(Boolean).join(' · ')

    // Dimensiones
    const LOGO_SIZE = 90
    const mapaW = Math.round(CONTENT_W * 0.78)
    const mapaH = Math.round(mapaW * 0.65)
    const mapaX = MARGIN + Math.round((CONTENT_W - mapaW) / 2)

    let yCursor = MARGIN

    // Logo arriba, centrado horizontalmente
    if (logo) {
      doc.image(logo, (PAGE_W - LOGO_SIZE) / 2, yCursor, { width: LOGO_SIZE })
      yCursor += LOGO_SIZE + 14
    }

    // Título principal: "Recorremos Memoria"
    doc.fillColor(C_STONE).font('Helvetica-Bold').fontSize(24)
      .text('Recorremos Memoria', MARGIN, yCursor, {
        width: CONTENT_W, align: 'center',
      })
    yCursor = doc.y + 14

    // Nombre de la escuela como subtítulo (bold gris)
    doc.fillColor(C_CONCRETE).font('Helvetica-Bold').fontSize(15)
      .text(escuela.nombre || 'Escuela', MARGIN, yCursor, {
        width: CONTENT_W, align: 'center',
      })
    yCursor = doc.y + 4

    // Dirección + barrio
    if (meta) {
      doc.font('Helvetica').fontSize(11).fillColor(C_DUST)
        .text(meta, MARGIN, yCursor, { width: CONTENT_W, align: 'center' })
      yCursor = doc.y + 14
    }

    // Fecha en su propio párrafo (más grande)
    doc.fontSize(12).fillColor(C_CONCRETE).font('Helvetica')
      .text(`Generado el ${formatFecha(new Date())}`, MARGIN, yCursor, {
        width: CONTENT_W, align: 'center',
      })
    yCursor = doc.y + 6

    // Filtros en otro párrafo abajo
    doc.fontSize(12).fillColor(C_CONCRETE).font('Helvetica')
      .text(
        `Radio de ${radio} metros · ${baldosas.length} baldosa${baldosas.length !== 1 ? 's' : ''}`,
        MARGIN, yCursor, { width: CONTENT_W, align: 'center' },
      )
    yCursor = doc.y + 22

    // Mapa estático con marco
    doc.image(mapaBuf, mapaX, yCursor, { width: mapaW, height: mapaH })
    doc.lineWidth(1.2).strokeColor(C_DUST).rect(mapaX, yCursor, mapaW, mapaH).stroke()
    yCursor += mapaH + 28

    // Aviso si se truncó
    if (truncado) {
      doc.fontSize(9).fillColor('#c0392b')
        .text(
          `Se incluyen las ${MAX_BALDOSAS} baldosas más cercanas. Hay ${totalEnRadio} baldosas en el radio total.`,
          MARGIN, yCursor, { width: CONTENT_W, align: 'center' },
        )
      yCursor = doc.y + 18
    }

    // QR centrado al pie de la portada con texto explicativo
    if (qrBuf) {
      const QR_SIZE = 90
      // Si no entra el QR completo más texto, lo subimos un poco
      const espacioMinimoQR = QR_SIZE + 40 + 24  // QR + texto + footer
      const yQR = Math.max(yCursor, PAGE_H - espacioMinimoQR)

      doc.image(qrBuf, (PAGE_W - QR_SIZE) / 2, yQR, { width: QR_SIZE, height: QR_SIZE })

      // Texto explicativo debajo del QR
      doc.font('Helvetica').fontSize(9).fillColor(C_DUST)
        .text(
          'Escaneá el código para abrir el recorrido en el mapa',
          MARGIN, yQR + QR_SIZE + 8,
          { width: CONTENT_W, align: 'center' },
        )
    }

    // (Footer de la web se renderiza solo al final del documento — ver más abajo)

    // ═══ BALDOSAS EN FLUJO CONTINUO ════════════════════════════════════
    // Nueva página solo para empezar el listado (después la portada queda libre)
    doc.addPage()

    // Header chico al inicio de las páginas siguientes
    if (logo) {
      doc.image(logo, MARGIN, MARGIN, { width: 32 })
    }
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C_STONE)
      .text(escuela.nombre || 'Escuela', MARGIN + 44, MARGIN + 4, {
        width: CONTENT_W - 50, lineBreak: false, ellipsis: true,
      })
    doc.font('Helvetica').fontSize(8).fillColor(C_DUST)
      .text('Baldosas del recorrido', MARGIN + 44, doc.y + 1, {
        width: CONTENT_W - 50, lineBreak: false,
      })

    // Línea bajo el header
    const headerBottomY = MARGIN + 36
    doc.lineWidth(0.5).strokeColor(C_DUST).opacity(0.35)
      .moveTo(MARGIN, headerBottomY).lineTo(PAGE_W - MARGIN, headerBottomY).stroke()
    doc.opacity(1)

    let y = headerBottomY + 14

    /** Reserva inferior — solo el margen normal de la página */
    const FOOTER_RESERVA = MARGIN

    for (let i = 0; i < baldosasConFotos.length; i++) {
      const b = baldosasConFotos[i]

      // Estimar altura del bloque para decidir si necesita salto de página.
      // No hay que ser exacto: es una cota para evitar que un bloque corte feo.
      const tieneFotos = b.fotosProcesadas.length > 0
      const altoEstim =
        20 +                              // título + meta
        (b.descripcion ? 80 : 0) +
        (b.infoExtendida ? 60 : 0) +
        (tieneFotos ? 145 : 0) +
        50                                // separador con más aire ahora

      // Si no entra en lo que queda de la página, salto.
      // Excepción: si es la primera baldosa de esta página y de todos modos no entra,
      // la imprimimos igual y dejamos que pdfkit pagine automáticamente con el contenido largo.
      const espacioRestante = PAGE_H - FOOTER_RESERVA - y
      const yaEscribiAlgoEnEstaPagina = y > headerBottomY + 14 + 5

      if (yaEscribiAlgoEnEstaPagina && altoEstim > espacioRestante) {
        doc.addPage()
        // Header chico en cada página
        if (logo) doc.image(logo, MARGIN, MARGIN, { width: 32 })
        doc.font('Helvetica-Bold').fontSize(11).fillColor(C_STONE)
          .text(escuela.nombre || 'Escuela', MARGIN + 44, MARGIN + 4, {
            width: CONTENT_W - 50, lineBreak: false, ellipsis: true,
          })
        doc.font('Helvetica').fontSize(8).fillColor(C_DUST)
          .text('Baldosas del recorrido (continuación)', MARGIN + 44, doc.y + 1, {
            width: CONTENT_W - 50, lineBreak: false,
          })
        const hY = MARGIN + 36
        doc.lineWidth(0.5).strokeColor(C_DUST).opacity(0.35)
          .moveTo(MARGIN, hY).lineTo(PAGE_W - MARGIN, hY).stroke()
        doc.opacity(1)
        y = hY + 14
      }

      // ── Render de la baldosa ──

      // Numerito + nombre principal
      doc.font('Helvetica-Bold').fontSize(13).fillColor(C_STONE)
        .text(`${i + 1}. ${b.nombre || 'Sin nombre'}`, MARGIN, y, { width: CONTENT_W })
      y = doc.y + 1

      // Código + dirección/barrio
      const metaB = [b.codigo, b.direccion, b.barrio].filter(Boolean).join(' · ')
      if (metaB) {
        doc.font('Helvetica').fontSize(8.5).fillColor(C_DUST)
          .text(metaB, MARGIN, y, { width: CONTENT_W })
        y = doc.y + 3
      }

      // Descripción
      if (b.descripcion) {
        doc.font('Helvetica').fontSize(9.5).fillColor(C_STONE)
          .text(truncar(b.descripcion, MAX_DESC_CHARS), MARGIN, y, {
            width: CONTENT_W, align: 'justify',
          })
        y = doc.y + 2
      }

      // InfoExtendida
      if (b.infoExtendida) {
        doc.font('Helvetica').fontSize(9.5).fillColor(C_CONCRETE)
          .text(truncar(b.infoExtendida, MAX_INFO_EXT_CHARS), MARGIN, y, {
            width: CONTENT_W, align: 'justify',
          })
        y = doc.y + 2
      }

      // Fotos en fila (todas con proporción 4:3 garantizada por el preprocess)
      if (b.fotosProcesadas.length > 0) {
        const n = b.fotosProcesadas.length
        const gap = 6          // gap chico, queda mejor cuando las fotos son uniformes
        const fW = (CONTENT_W - gap * (n - 1)) / n
        // Alto fijo a 3/4 del ancho (proporción 4:3 idéntica al crop del preprocess).
        // Tope de 132pt (+20% sobre los 110 anteriores).
        const fH = Math.min((fW * 3) / 4, 132)
        const fotosY = y + 4
        for (let j = 0; j < n; j++) {
          const fx = MARGIN + j * (fW + gap)
          try {
            // La foto entra exactamente en su caja porque comparten proporción
            doc.image(b.fotosProcesadas[j], fx, fotosY, {
              width: fW, height: fH,
            })
            // Borde fino para cada foto
            doc.lineWidth(0.6).strokeColor(C_DUST)
              .rect(fx, fotosY, fW, fH).stroke()
          } catch (e) {
            console.warn('[pdf] No se pudo insertar foto:', e)
          }
        }
        y = fotosY + fH + 6
      }

      // Separador entre baldosas (excepto la última) — con bastante aire
      if (i < baldosasConFotos.length - 1) {
        y += 14
        doc.lineWidth(0.5).strokeColor(C_DUST).opacity(0.3)
          .moveTo(MARGIN + 40, y).lineTo(PAGE_W - MARGIN - 40, y).stroke()
        doc.opacity(1)
        y += 22
      } else {
        y += 14
      }
    }

    // ═══ FOOTER FINAL (solo en la última página, estilo web) ═══════════
    const FOOTER_FINAL_H = 200
    // Si el footer no entra en lo que queda de la última página, agregar página nueva.
    // Necesitamos al menos FOOTER_FINAL_H pt para el footer + un margen.
    const yDesponible = PAGE_H - y
    if (yDesponible < FOOTER_FINAL_H + 20) {
      doc.addPage()
    }
    // Dibujar el footer al pie de la página actual (sea esta o la recién agregada)
    renderFooterFinal(doc, logo, PAGE_H - FOOTER_FINAL_H)

    doc.end()
    const pdfBuf = await donePromise

    // Timestamp YYYY-MM-DD_HHmm para evitar colisiones al descargar
    // varios PDFs de la misma escuela en distintos momentos
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`

    const filename = `recorrido-${(escuela.nombre || 'escuela')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().slice(0, 50)}-${timestamp}.pdf`

    return new NextResponse(new Uint8Array(pdfBuf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuf.length),
      },
    })
  } catch (e: any) {
    console.error('[pdf] Error generando PDF:', e)
    return NextResponse.json(
      { error: 'No se pudo generar el PDF', detalle: e?.message },
      { status: 500 },
    )
  }
}
