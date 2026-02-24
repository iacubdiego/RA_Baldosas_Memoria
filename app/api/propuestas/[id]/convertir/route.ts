import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Propuesta from '@/models/Propuesta';
import Baldosa from '@/models/Baldosa';

/**
 * POST /api/propuestas/[id]/convertir
 *
 * Convierte una propuesta aprobada en una baldosa location-based.
 * Ya NO requiere archivo .mind — las coordenadas GPS son suficientes.
 *
 * Body JSON:
 *   codigo        string  (único, ej: BALD-0042)
 *   categoria     string
 *   barrio        string | null
 *   mensajeAR     string
 *   infoExtendida string | null
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const body = await request.json();
    const {
      codigo,
      categoria,
      barrio,
      mensajeAR,
      infoExtendida,
    } = body as {
      codigo:        string
      categoria:     string
      barrio?:       string | null
      mensajeAR:     string
      infoExtendida?: string | null
    };

    // ── Validaciones ───────────────────────────────────────────────────────
    if (!codigo || codigo.trim().length < 4) {
      return NextResponse.json(
        { error: 'Código inválido (mínimo 4 caracteres)' },
        { status: 400 }
      );
    }

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoría es requerida' },
        { status: 400 }
      );
    }

    if (!mensajeAR || mensajeAR.trim().length < 5) {
      return NextResponse.json(
        { error: 'Mensaje AR inválido (mínimo 5 caracteres)' },
        { status: 400 }
      );
    }

    await connectDB();

    // ── Propuesta ──────────────────────────────────────────────────────────
    const propuesta = await Propuesta.findById(id);

    if (!propuesta) {
      return NextResponse.json(
        { error: 'Propuesta no encontrada' },
        { status: 404 }
      );
    }

    if (propuesta.estado !== 'aprobada') {
      return NextResponse.json(
        { error: 'La propuesta debe estar aprobada primero' },
        { status: 400 }
      );
    }

    // ── Código único ───────────────────────────────────────────────────────
    const codigoNormalizado = codigo.trim().toUpperCase();
    const existeCodigo = await Baldosa.findOne({ codigo: codigoNormalizado });
    if (existeCodigo) {
      return NextResponse.json(
        { error: `Ya existe una baldosa con el código ${codigoNormalizado}` },
        { status: 400 }
      );
    }

    // ── Imagen de la propuesta (si existe) ────────────────────────────────
    // Se guarda como imagenUrl y como fotoUrl para el portaretrato AR.
    // Si la propuesta tiene imagenBase64, se usa como fotoUrl directamente
    // (Vercel no tiene sistema de ficheros persistente, así que base64 funciona
    // como fallback hasta que se suba a un CDN externo como Cloudinary/R2).
    let fotoUrl: string | undefined
    let imagenUrl: string

    if (propuesta.imagenBase64) {
      fotoUrl   = propuesta.imagenBase64   // base64 directo para AR
      imagenUrl = propuesta.imagenBase64
    } else {
      imagenUrl = `https://via.placeholder.com/400x500?text=${encodeURIComponent(propuesta.nombrePersona)}`
    }

    // ── Coordenadas ────────────────────────────────────────────────────────
    const [lng, lat] = propuesta.ubicacion.coordinates;

    // ── Crear baldosa ──────────────────────────────────────────────────────
    const nuevaBaldosa = new Baldosa({
      codigo:       codigoNormalizado,
      nombre:       propuesta.nombrePersona,
      descripcion:  propuesta.descripcion,
      categoria,
      ubicacion: {
        type:        'Point',
        coordinates: [lng, lat],
      },
      direccion:    propuesta.direccion  || undefined,
      barrio:       barrio?.trim()       || undefined,
      imagenUrl,
      fotoUrl,
      mensajeAR:    mensajeAR.trim(),
      infoExtendida: infoExtendida?.trim() || propuesta.descripcion,
      vecesEscaneada: 0,
      activo: true,
    });

    await nuevaBaldosa.save();

    // ── Marcar propuesta como procesada ───────────────────────────────────
    await Propuesta.findByIdAndUpdate(id, {
      $set: {
        notas:     `Procesada → Baldosa ${codigoNormalizado} (${nuevaBaldosa._id.toString()})`,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Baldosa ${codigoNormalizado} creada exitosamente (location-based)`,
      baldosa: {
        id:        nuevaBaldosa._id.toString(),
        codigo:    codigoNormalizado,
        nombre:    nuevaBaldosa.nombre,
        lat,
        lng,
        imagenUrl: nuevaBaldosa.imagenUrl,
      },
    });

  } catch (error) {
    console.error('Error en /api/propuestas/[id]/convertir:', error);
    return NextResponse.json(
      {
        error:  'Error al convertir propuesta',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
