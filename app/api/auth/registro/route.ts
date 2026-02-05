import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Usuario from '@/models/Usuario';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nombre } = body;

    // Validaciones
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    if (!nombre || nombre.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const nuevoUsuario = new Usuario({
      email: email.toLowerCase(),
      password: passwordHash,
      nombre: nombre.trim(),
    });

    await nuevoUsuario.save();

    // Crear token JWT
    const token = await createToken({
      userId: nuevoUsuario._id.toString(),
      email: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
    });

    // Guardar en cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: nuevoUsuario._id.toString(),
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
      },
    });

  } catch (error) {
    console.error('Error en /api/auth/registro:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
