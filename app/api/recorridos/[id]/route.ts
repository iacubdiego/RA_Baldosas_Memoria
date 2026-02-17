import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Recorrido from '@/models/Recorrido';
import { requireAuth } from '@/lib/authMiddleware';

/**
 * DELETE /api/recorridos/[id]
 * Elimina una baldosa del recorrido del usuario
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const recorridoId = params.id;

    if (!recorridoId) {
      return NextResponse.json(
        { error: 'ID de recorrido requerido' },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar el recorrido
    const recorrido = await Recorrido.findById(recorridoId);

    if (!recorrido) {
      return NextResponse.json(
        { error: 'Baldosa no encontrada en tu recorrido' },
        { status: 404 }
      );
    }

    // Verificar que el recorrido pertenece al usuario
    if (recorrido.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'No tenés permiso para eliminar esta baldosa' },
        { status: 403 }
      );
    }

    // Eliminar
    await Recorrido.findByIdAndDelete(recorridoId);

    console.log(`✅ Baldosa eliminada: ${recorridoId} por usuario ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Baldosa eliminada de tu recorrido',
      baldosaId: recorrido.baldosaId
    });

  } catch (error) {
    console.error('❌ Error eliminando baldosa:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la baldosa' },
      { status: 500 }
    );
  }
}
