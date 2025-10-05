import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Debug-Logs für Session-Status
  console.log(`Middleware: ${pathname} - Start`)
  console.log(`Middleware: NEXTAUTH_SECRET gesetzt:`, !!process.env.NEXTAUTH_SECRET)
  
  const cookieHeader = request.headers.get('cookie')
  console.log(`Middleware: Cookie-Header vorhanden:`, !!cookieHeader)
  console.log(`Middleware: Cookie-Header Länge:`, cookieHeader?.length || 0)
  
  if (cookieHeader) {
    const sessionCookie = cookieHeader.includes('next-auth.session-token')
    console.log(`Middleware: Session-Cookie gefunden:`, sessionCookie)
    
    if (sessionCookie) {
      console.log(`Middleware: Session-Cookie Wert:`, cookieHeader.match(/next-auth\.session-token=([^;]+)/)?.[1]?.substring(0, 50) + '...')
    }
  }
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })
  
  console.log(`Middleware: ${pathname} - Token vorhanden:`, !!token)
  
  if (token) {
    console.log('Middleware: Token-Details:', {
      email: token.email,
      id: token.id,
      exp: token.exp,
      iat: token.iat
    })
  } else {
    console.log('Middleware: Kein Token gefunden')
  }

  // Öffentliche Routen die nicht geschützt werden müssen
  const publicRoutes = ['/login', '/register', '/api/auth', '/api/register', '/api/webhooks']
  
  // API-Routen die geschützt sind aber nicht weiterleiten sollen
  const apiRoutes = ['/api/tasks']
  
  // Prüfen ob die Route öffentlich ist
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isApiRoute = apiRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    console.log(`Middleware: Öffentliche Route ${pathname} - Weiterleitung erlaubt`)
    return NextResponse.next()
  }

  // Für API-Routen: Weiterleiten ohne Redirect (API gibt 401 zurück)
  if (isApiRoute) {
    console.log(`Middleware: API-Route ${pathname} - Weiterleitung erlaubt`)
    return NextResponse.next()
  }

  // Wenn kein Token vorhanden ist, zur Login-Seite weiterleiten
  if (!token) {
    console.log(`Middleware: Kein Token für ${pathname} - Weiterleitung zu /login`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  console.log(`Middleware: Token vorhanden für ${pathname} - Zugriff erlaubt`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
