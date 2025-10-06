import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    // Fallback: Check for auth token in cookies without Supabase call
    const authToken = request.cookies.get('sb-access-token')?.value
    if (authToken) {
      // If we have a token, assume user is authenticated
      // This is a fallback for Edge Runtime compatibility
      user = { email: 'authenticated' }
    }
  }

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.includes(pathname)

  // API routes that don't require authentication
  const publicApiRoutes = ['/api/auth/callback', '/api/webhooks']
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))
  
  // API routes that handle their own authentication
  const protectedApiRoutes = ['/api/tasks']
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route))

  console.log(`🔐 MIDDLEWARE: ${pathname} - User: ${user ? user.email : 'nicht angemeldet'}`)

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute && !isPublicApiRoute && !isProtectedApiRoute) {
    console.log(`🚫 MIDDLEWARE: Unauthorized access to ${pathname}, redirecting to login`)
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (user && (pathname === '/login' || pathname === '/register')) {
    console.log(`✅ MIDDLEWARE: Authenticated user accessing ${pathname}, redirecting to home`)
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
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
     * - api/tasks (tasks API routes - handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks|api/tasks).*)',
  ],
}