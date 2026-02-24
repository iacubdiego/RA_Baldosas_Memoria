import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Baldosa from '@/models/Baldosa';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // ⚠️ Sin .limit() — devuelve todas las baldosas activas
    const baldosas = await Baldosa.find({ activo: true });

    const result = baldosas.map(baldosa => {
      const [lng, lat] = baldosa.ubicacion.coordinates;
      return {
        id:          baldosa._id.toString(),
        codigo:      baldosa.codigo,
        nombre:      baldosa.nombre,
        descripcion: baldosa.descripcion,
        lat,
        lng,
        direccion:   baldosa.direccion,
        barrio:      baldosa.barrio,
        imagenUrl:   baldosa.imagenUrl,
        fotoUrl:     baldosa.fotoUrl,
        mensajeAR:   baldosa.mensajeAR,
      };
    });

    return NextResponse.json({ baldosas: result, total: result.length });
  } catch (error) {
    console.error('Error en /api/baldosas:', error);
    return NextResponse.json(
      { error: 'Error al obtener baldosas', detail: String(error) },
      { status: 500 }
    );
  }
}
