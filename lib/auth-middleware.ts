import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromCookie } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    edad: number;
  };
}

/**
 * Middleware para verificar autenticación
 * Retorna el usuario autenticado o null si no está autenticado
 */
export async function authenticateUser(request: NextRequest) {
  try {
    // Extraer token de la cookie
    const cookieHeader = request.headers.get('cookie');
    const token = extractTokenFromCookie(cookieHeader);

    if (!token) {
      return null;
    }

    // Verificar token
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    await connectDB();

    // Buscar usuario
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      edad: user.edad
    };

  } catch (error) {
    console.error('Error en authenticateUser:', error);
    return null;
  }
}

/**
 * Función helper para rutas que requieren autenticación
 */
export async function requireAuth(request: NextRequest) {
  const user = await authenticateUser(request);
  
  if (!user) {
    throw new Error('No autenticado');
  }
  
  return user;
}
