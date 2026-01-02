import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Baldosa from '@/models/Baldosa';

export async function GET(request: NextRequest) {
  try {
    const conn = await connectDB();
    
    // Debug: mostrar info de conexión
    const dbName = conn.connection.db?.databaseName;
    console.log('Conectado a DB:', dbName);

    // Intentar obtener baldosas sin filtro
    const baldosas = await Baldosa.find({}).limit(50);
    
    console.log('Baldosas encontradas:', baldosas.length);

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
      debug: {
        database: dbName,
        mongoUri: process.env.MONGODB_URI?.substring(0, 50) + '...',
      }
    });
  } catch (error) {
    console.error('Error en /api/baldosas:', error);
    return NextResponse.json(
      { error: 'Error al obtener baldosas', detail: String(error) },
      { status: 500 }
    );
  }
}
