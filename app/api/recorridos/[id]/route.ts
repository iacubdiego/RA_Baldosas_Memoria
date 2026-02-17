import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Recorrido from '@/models/Recorrido';
import { requireAuth } from '@/lib/auth-middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de recorrido requerido' },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar el recorrido asegurándonos que pertenece al usuario autenticado
    // Esto garantiza que NUNCA se toque el modelo Baldosa ni datos de otros usuarios
    const recorrido = await Recorrido.findOne({
      _id: id,
      userId: user.id,
    });

    if (!recorrido) {
      return NextResponse.json(
        { error: 'Registro no encontrado o no tienes permiso para eliminarlo' },
        { status: 404 }
      );
    }

    await Recorrido.deleteOne({ _id: id, userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Baldosa eliminada de tu recorrido',
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/recorridos/[id]:', error);

    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para realizar esta acción' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error al eliminar el registro' },
      { status: 500 }
    );
  }
}
