import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nombre, apellido, edad } = body;

    // Validaciones
    if (!email || !password || !nombre || !apellido || !edad) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    if (edad < 1 || edad > 120) {
      return NextResponse.json(
        { error: 'Edad inválida' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Crear usuario
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      nombre,
      apellido,
      edad: parseInt(edad)
    });

    // Generar token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email
    });

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user._id.toString(),
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        edad: user.edad
      }
    }, { status: 201 });

    // Establecer cookie httpOnly
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('Error en registro:', error);
    
    // Manejo específico de errores de MongoDB
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
