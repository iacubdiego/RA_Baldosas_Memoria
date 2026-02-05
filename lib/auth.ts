import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'baldosas-memoria-secret-key-change-in-production'
);

// Renombrar el tipo para evitar conflicto con jose
export interface AuthJWTPayload {
  userId: string;
  email: string;
  nombre: string;
  rol?: string;
}

export async function generarToken(payload: AuthJWTPayload): Promise<string> {
  try {
    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
    
    return token;
  } catch (error) {
    console.error('Error generando token:', error);
    throw new Error('Error al generar token de autenticación');
  }
}

// Alias para compatibilidad con código existente
export const createToken = generarToken;

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 días
    path: '/'
  });
}

export async function verificarToken(token: string): Promise<AuthJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Convertir a través de unknown para evitar el error de tipo
    return payload as unknown as AuthJWTPayload;
  } catch (error) {
    console.error('Error verificando token:', error);
    return null;
  }
}

export async function obtenerUsuarioActual(request: NextRequest): Promise<AuthJWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    return await verificarToken(token);
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    return null;
  }
}

export function esAdmin(usuario: AuthJWTPayload | null): boolean {
  return usuario?.rol === 'admin';
}
