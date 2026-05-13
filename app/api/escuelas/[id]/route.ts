import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Escuela from '@/models/Escuela';
import Baldosa from '@/models/Baldosa';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectDB();

    const escuela = await Escuela.findById(id).lean() as any;

    if (!escuela || !escuela.activo) {
      return NextResponse.json({ error: 'Escuela no encontrada' }, { status: 404 });
    }

    // Traer las baldosas del recorrido con sus coordenadas (para la ruta)
    const baldosaIds = escuela.baldosas_ids ?? [];
    const baldosas = await Baldosa.find({
      _id: { $in: baldosaIds },
      activo: true,
    })
      .select('_id codigo nombre direccion barrio ubicacion')
      .lean() as any[];

    // Reordenar según el orden definido en baldosas_ids
    const baldosasOrdenadas = baldosaIds
      .map((id: any) =>
        baldosas.find((b: any) => b._id.toString() === id.toString())
      )
      .filter(Boolean)
      .map((b: any) => ({
        id:        b._id.toString(),
        codigo:    b.codigo,
        nombre:    b.nombre,
        direccion: b.direccion || '',
        barrio:    b.barrio || '',
        lat:       b.ubicacion.coordinates[1],
        lng:       b.ubicacion.coordinates[0],
      }));

    return NextResponse.json({
      escuela: {
        id:           escuela._id.toString(),
        nombre:       escuela.nombre,
        direccion:    escuela.direccion,
        barrio:       escuela.barrio,
        lat:          escuela.ubicacion.coordinates[1],
        lng:          escuela.ubicacion.coordinates[0],
        baldosas:     baldosasOrdenadas,
        ruta_geojson: escuela.ruta_geojson ?? null,
      },
    });
  } catch (error) {
    console.error('Error en GET /api/escuelas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener escuela', detail: String(error) },
      { status: 500 }
    );
  }
}
