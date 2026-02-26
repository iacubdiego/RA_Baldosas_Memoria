import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Baldosa from '@/models/Baldosa';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await connectDB();

    let baldosa = null;
    
    // Intentar buscar por _id si parece un ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        baldosa = await Baldosa.findById(id);
      } catch (error) {
        console.log('No es un ObjectId válido, buscando por codigo');
      }
    }
    
    // Si no se encontró por _id, buscar por codigo
    if (!baldosa) {
      baldosa = await Baldosa.findOne({ codigo: id });
    }

    if (!baldosa || !baldosa.activo) {
      return NextResponse.json(
        { error: 'Baldosa no encontrada' },
        { status: 404 }
      );
    }

    const [lng, lat] = baldosa.ubicacion.coordinates;

    return NextResponse.json({
      baldosa: {
        id: baldosa._id.toString(),
        codigo: baldosa.codigo,
        nombre: baldosa.nombre,
        descripcion: baldosa.descripcion,
        categoria: baldosa.categoria,
        lat,
        lng,
        direccion: baldosa.direccion,
        barrio: baldosa.barrio,
        imagenUrl: baldosa.imagenUrl,
        fotoUrl: baldosa.fotoUrl,
        audioUrl: baldosa.audioUrl,
        mensajeAR: baldosa.mensajeAR,
        infoExtendida: baldosa.infoExtendida,
        vecesEscaneada: baldosa.vecesEscaneada,
        clusterId: baldosa.clusterId,
        targetIndex: baldosa.targetIndex,
        mindFileUrl: baldosa.mindFileUrl,
      }
    });
  } catch (error) {
    console.error('Error en /api/baldosas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener baldosa' },
      { status: 500 }
    );
  }
}

// ── PATCH: incrementar vecesEscaneada ────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await connectDB();

    let baldosa = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        baldosa = await Baldosa.findByIdAndUpdate(
          id,
          { $inc: { vecesEscaneada: 1 } },
          { new: true }
        );
      } catch {
        // no era ObjectId, intentar por codigo
      }
    }

    if (!baldosa) {
      baldosa = await Baldosa.findOneAndUpdate(
        { codigo: id },
        { $inc: { vecesEscaneada: 1 } },
        { new: true }
      );
    }

    if (!baldosa) {
      return NextResponse.json(
        { error: 'Baldosa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ vecesEscaneada: baldosa.vecesEscaneada });

  } catch (error) {
    console.error('Error en PATCH /api/baldosas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar contador' },
      { status: 500 }
    );
  }
}
