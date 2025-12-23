import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Propuesta from '@/models/Propuesta';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { nombrePersona, descripcion, lat, lng, direccion, imagenBase64, emailContacto } = body;

    // Validaciones
    if (!nombrePersona || nombrePersona.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      );
    }

    if (!descripcion || descripcion.trim().length < 10) {
      return NextResponse.json(
        { error: 'La descripción es requerida (mínimo 10 caracteres)' },
        { status: 400 }
      );
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'La ubicación es requerida' },
        { status: 400 }
      );
    }

    // Validar tamaño de imagen (max ~5MB en base64)
    if (imagenBase64 && imagenBase64.length > 7000000) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    await connectDB();

    const nuevaPropuesta = new Propuesta({
      nombrePersona: nombrePersona.trim(),
      descripcion: descripcion.trim(),
      ubicacion: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      direccion: direccion?.trim() || null,
      imagenBase64: imagenBase64 || null,
      emailContacto: emailContacto?.trim() || null,
      estado: 'pendiente',
    });

    await nuevaPropuesta.save();

    return NextResponse.json({
      success: true,
      message: 'Propuesta enviada correctamente. ¡Gracias por colaborar!',
      id: nuevaPropuesta._id.toString(),
    });

  } catch (error) {
    console.error('Error en POST /api/propuestas:', error);
    return NextResponse.json(
      { error: 'Error al enviar la propuesta. Intenta nuevamente.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || 'pendiente';

    await connectDB();

    const propuestas = await Propuesta.find({ estado })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-imagenBase64'); // Excluir imagen para listar

    return NextResponse.json({
      propuestas: propuestas.map(p => ({
        id: p._id.toString(),
        nombrePersona: p.nombrePersona,
        descripcion: p.descripcion,
        lat: p.ubicacion.coordinates[1],
        lng: p.ubicacion.coordinates[0],
        direccion: p.direccion,
        emailContacto: p.emailContacto,
        estado: p.estado,
        createdAt: p.createdAt,
      })),
      total: propuestas.length,
    });

  } catch (error) {
    console.error('Error en GET /api/propuestas:', error);
    return NextResponse.json(
      { error: 'Error al obtener propuestas' },
      { status: 500 }
    );
  }
}
