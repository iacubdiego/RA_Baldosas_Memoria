import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Baldosa from '@/models/Baldosa';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const baldosas = await Baldosa.find({ activo: true }).limit(50);

    const result = baldosas.map(baldosa => {
      const [lng, lat] = baldosa.ubicacion.coordinates;
      return {
        id: baldosa._id.toString(),
        codigo: baldosa.codigo,
        nombre: baldosa.nombre,
        descripcion: baldosa.descripcion,
        categoria: baldosa.categoria,
        lat,
        lng,
        direccion: baldosa.direccion,
        barrio: baldosa.barrio,
        mensajeAR: baldosa.mensajeAR,
        imagenUrl: baldosa.imagenUrl,
        targetIndex: baldosa.targetIndex,
      };
    });

    return NextResponse.json({
      baldosas: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Error en /api/baldosas:', error);
    return NextResponse.json(
      { error: 'Error al obtener baldosas', detail: String(error) },
      { status: 500 }
    );
  }
}
