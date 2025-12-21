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

    const baldosa = await Baldosa.findById(id);

    if (!baldosa || !baldosa.activo) {
      return NextResponse.json(
        { error: 'Baldosa no encontrada' },
        { status: 404 }
      );
    }

    const [lng, lat] = baldosa.ubicacion.coordinates;

    return NextResponse.json({
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
      audioUrl: baldosa.audioUrl,
      mensajeAR: baldosa.mensajeAR,
      infoExtendida: baldosa.infoExtendida,
      vecesEscaneada: baldosa.vecesEscaneada,
      clusterId: baldosa.clusterId,
      targetIndex: baldosa.targetIndex,
    });
  } catch (error) {
    console.error('Error en /api/baldosas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener baldosa' },
      { status: 500 }
    );
  }
}
