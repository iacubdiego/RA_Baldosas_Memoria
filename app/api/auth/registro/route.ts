import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Usuario from '@/models/Usuario';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { nombre, email, password } = body;

    // Validaciones
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
    
    if (usuarioExistente) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const nuevoUsuario = await Usuario.create({
      nombre,
      email: email.toLowerCase(),
      password: hashedPassword,
      rol: 'usuario' // rol por defecto
    });

    // Generar token
    const token = await createToken({
      userId: nuevoUsuario._id.toString(),
      email: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
      rol: nuevoUsuario.rol
    });

    // Crear respuesta y agregar cookie
    const response = NextResponse.json({
      success: true,
      usuario: {
        id: nuevoUsuario._id.toString(),
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol
      },
      token
    }, { status: 201 });

    // IMPORTANTE: setAuthCookie recibe la response y el token
    setAuthCookie(response, token);

    return response;

  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el usuario' },
      { status: 500 }
    );
  }
}
