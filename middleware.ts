import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu-secret-super-seguro-cambialo-en-produccion'
);

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  '/scanner',
  '/mapa',
  '/coleccion',
  '/api/coleccion',
];

// Rutas de auth que NO deben ser accesibles si ya estás logueado
const AUTH_ROUTES = [
  '/login',
  '/registro',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Obtener token de la cookie
  const token = request.cookies.get('baldosas-auth-token')?.value;
  
  let isAuthenticated = false;
  
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (error) {
      // Token inválido o expirado
      isAuthenticated = false;
    }
  }
  
  // Si la ruta está protegida y NO estás autenticado -> redirect a login
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Si estás en página de auth y YA estás autenticado -> redirect a home
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mind)$).*)',
  ],
};
