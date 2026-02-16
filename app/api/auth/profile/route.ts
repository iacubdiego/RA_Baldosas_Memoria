import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth-middleware';

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);

    const body = await request.json();
    const { nombre, apellido, edad, passwordActual, passwordNueva } = body;

    await connectDB();

    // Buscar usuario
    const currentUser = await User.findById(user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si quiere cambiar contraseña, verificar la actual
    if (passwordNueva) {
      if (!passwordActual) {
        return NextResponse.json(
          { error: 'Debes ingresar tu contraseña actual' },
          { status: 400 }
        );
      }

      const isPasswordValid = await currentUser.comparePassword(passwordActual);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 401 }
        );
      }

      if (passwordNueva.length < 6) {
        return NextResponse.json(
          { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }

      currentUser.password = passwordNueva;
    }

    // Actualizar otros campos
    if (nombre) currentUser.nombre = nombre;
    if (apellido) currentUser.apellido = apellido;
    if (edad) {
      const edadNum = parseInt(edad);
      if (isNaN(edadNum) || edadNum < 1 || edadNum > 120) {
        return NextResponse.json(
          { error: 'Edad inválida' },
          { status: 400 }
        );
      }
      currentUser.edad = edadNum;
    }

    await currentUser.save();

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: currentUser._id.toString(),
        email: currentUser.email,
        nombre: currentUser.nombre,
        apellido: currentUser.apellido,
        edad: currentUser.edad
      }
    });

  } catch (error: any) {
    console.error('Error en PUT /api/auth/profile:', error);

    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
