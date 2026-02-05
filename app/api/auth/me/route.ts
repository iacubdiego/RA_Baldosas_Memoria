import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Usuario from '@/models/Usuario';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Obtener usuario actual del token
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Buscar datos completos del usuario en la BD
    const usuario = await Usuario.findById(currentUser.userId).select('-password');
    
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario._id.toString(),
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos del usuario' },
      { status: 500 }
    );
  }
}
