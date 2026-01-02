import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Propuesta from '@/models/Propuesta';

// GET - Obtener una propuesta específica (con imagen)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await connectDB();

    const propuesta = await Propuesta.findById(id);

    if (!propuesta) {
      return NextResponse.json(
        { error: 'Propuesta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      propuesta: {
        id: propuesta._id.toString(),
        nombrePersona: propuesta.nombrePersona,
        descripcion: propuesta.descripcion,
        lat: propuesta.ubicacion.coordinates[1],
        lng: propuesta.ubicacion.coordinates[0],
        direccion: propuesta.direccion,
        imagenBase64: propuesta.imagenBase64,
        emailContacto: propuesta.emailContacto,
        estado: propuesta.estado,
        notas: propuesta.notas,
        createdAt: propuesta.createdAt,
        updatedAt: propuesta.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error en GET /api/propuestas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener propuesta' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado de una propuesta
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { estado, notas } = body;

    if (estado && !['pendiente', 'aprobada', 'rechazada'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateData: any = { updatedAt: new Date() };
    if (estado) updateData.estado = estado;
    if (notas !== undefined) updateData.notas = notas;

    const propuesta = await Propuesta.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!propuesta) {
      return NextResponse.json(
        { error: 'Propuesta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Propuesta ${estado || 'actualizada'}`,
      propuesta: {
        id: propuesta._id.toString(),
        estado: propuesta.estado,
      },
    });
  } catch (error) {
    console.error('Error en PATCH /api/propuestas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar propuesta' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una propuesta
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await connectDB();

    const propuesta = await Propuesta.findByIdAndDelete(id);

    if (!propuesta) {
      return NextResponse.json(
        { error: 'Propuesta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Propuesta eliminada',
    });
  } catch (error) {
    console.error('Error en DELETE /api/propuestas/[id]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar propuesta' },
      { status: 500 }
    );
  }
}
