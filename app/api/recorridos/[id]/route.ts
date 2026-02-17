import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Recorrido from '@/models/Recorrido';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);

    await connectDB();

    // Obtener recorridos del usuario ordenados por fecha
    const recorridos = await Recorrido.find({ userId: user.id })
      .sort({ fechaEscaneo: -1 });

    return NextResponse.json({
      recorridos: recorridos.map(r => ({
        id: r._id.toString(),
        baldosaId: r.baldosaId,
        nombreVictima: r.nombreVictima,
        fechaDesaparicion: r.fechaDesaparicion,
        fechaEscaneo: r.fechaEscaneo,
        fotoBase64: r.fotoBase64,
        ubicacion: r.ubicacion,
        lat: r.lat,
        lng: r.lng,
        notas: r.notas
      })),
      total: recorridos.length
    });

  } catch (error: any) {
    console.error('Error en GET /api/recorridos:', error);
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para ver tu recorrido' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error al obtener recorridos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);

    const body = await request.json();
    const {
      baldosaId,
      nombreVictima,
      fechaDesaparicion,
      fotoBase64,
      ubicacion,
      lat,
      lng,
      notas
    } = body;

    // Validaciones
    if (!baldosaId || !nombreVictima || !fotoBase64 || !ubicacion || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar si ya escaneó esta baldosa
    const existente = await Recorrido.findOne({
      userId: user.id,
      baldosaId
    });

    if (existente) {
      return NextResponse.json(
        { error: 'Ya has escaneado esta baldosa' },
        { status: 400 }
      );
    }

    // Crear recorrido
    const recorrido = await Recorrido.create({
      userId: user.id,
      baldosaId,
      nombreVictima,
      fechaDesaparicion: fechaDesaparicion || '',
      fotoBase64,
      ubicacion,
      lat,
      lng,
      notas: notas || ''
    });

    return NextResponse.json({
      success: true,
      message: 'Baldosa agregada a tu recorrido',
      recorrido: {
        id: recorrido._id.toString(),
        baldosaId: recorrido.baldosaId,
        nombreVictima: recorrido.nombreVictima,
        fechaEscaneo: recorrido.fechaEscaneo,
        ubicacion: recorrido.ubicacion
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/recorridos:', error);

    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para guardar baldosas' },
        { status: 401 }
      );
    }

    // Error de duplicado
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Ya has escaneado esta baldosa' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al guardar baldosa' },
      { status: 500 }
    );
  }
}