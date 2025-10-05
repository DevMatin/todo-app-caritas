import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`🔍 MIDDLEWARE V2: ${pathname} - Start`)
  console.log(`🔍 MIDDLEWARE V2: NEXTAUTH_SECRET vorhanden:`, !!process.env.NEXTAUTH_SECRET)
  console.log(`🔍 MIDDLEWARE V2: NEXTAUTH_URL vorhanden:`, !!process.env.NEXTAUTH_URL)
  
  // Öffentliche Routen die nicht geschützt werden müssen
  const publicRoutes = ['/login', '/register', '/api/auth', '/api/register', '/api/webhooks']
  
  // Prüfen ob die Route öffentlich ist
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    console.log(`✅ MIDDLEWARE V2: Öffentliche Route ${pathname} - Weiterleitung erlaubt`)
    return NextResponse.next()
  }

  // Versuche Token zu lesen
  console.log(`🔍 MIDDLEWARE V2: Versuche Token zu lesen für ${pathname}`)
  
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })
    
    console.log(`🔍 MIDDLEWARE V2: Token gefunden:`, !!token)
    
    if (token) {
      console.log(`✅ MIDDLEWARE V2: Token vorhanden für ${pathname} - Zugriff erlaubt`)
      console.log(`🔍 MIDDLEWARE V2: Token-Details:`, {
        email: token.email,
        id: token.id,
        exp: token.exp
      })
      return NextResponse.next()
    } else {
      console.log(`❌ MIDDLEWARE V2: Kein Token für ${pathname} - Weiterleitung zu /login`)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch (error) {
    console.log(`❌ MIDDLEWARE V2: Fehler beim Token-Lesen:`, error)
    console.log(`❌ MIDDLEWARE V2: Weiterleitung zu /login wegen Fehler`)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth API routes)
     * - api/webhooks (webhook routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)',
  ],
}