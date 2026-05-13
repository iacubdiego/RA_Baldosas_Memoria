import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Escuela from '@/models/Escuela';

export async function GET() {
  try {
    await connectDB();

    const escuelas = await Escuela.find({ activo: true })
      .select('_id nombre direccion barrio ubicacion baldosas_ids ruta_geojson')
      .lean();

    const result = escuelas.map((e: any) => ({
      id:           e._id.toString(),
      nombre:       e.nombre,
      direccion:    e.direccion,
      barrio:       e.barrio,
      lat:          e.ubicacion.coordinates[1],
      lng:          e.ubicacion.coordinates[0],
      baldosas_ids: e.baldosas_ids.map((id: any) => id.toString()),
      ruta_geojson: e.ruta_geojson ?? null,
    }));

    return NextResponse.json({ escuelas: result, total: result.length });
  } catch (error) {
    console.error('Error en GET /api/escuelas:', error);
    return NextResponse.json(
      { error: 'Error al obtener escuelas', detail: String(error) },
      { status: 500 }
    );
  }
}
