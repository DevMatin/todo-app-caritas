import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { addConnection, removeConnection } from '@/lib/sse'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

// Force dynamic rendering für SSE
export const dynamic = 'force-dynamic'

// SSE-Endpoint für Echtzeit-Updates
export async function GET(request: NextRequest) {
  try {
    console.log('SSE: Neue Verbindungsanfrage erhalten')
    console.log('SSE: Request URL:', request.url)
    console.log('SSE: Request Headers:', Object.fromEntries(request.headers.entries()))
    
    // Prüfe Umgebungsvariablen
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('SSE: Supabase-Umgebungsvariablen fehlen')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Supabase-Client mit Request-Cookies erstellen
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }: any) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }: any) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // User authentifizieren
    console.log('SSE: Versuche User-Authentifizierung...')
    
    // Prüfe zuerst die Cookies direkt
    const accessToken = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value
    
    console.log('SSE: Access Token vorhanden:', !!accessToken)
    console.log('SSE: Refresh Token vorhanden:', !!refreshToken)
    
    if (!accessToken && !refreshToken) {
      console.log('SSE: Keine Auth-Cookies gefunden')
      return NextResponse.json({ error: 'No authentication cookies' }, { status: 401 })
    }
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('SSE: Authentifizierungsfehler:', error)
      console.error('SSE: Fehler-Details:', {
        message: error.message,
        status: error.status
      })
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!user) {
      console.log('SSE: Keine authentifizierte Session - User ist null')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('SSE: Authentifizierter User gefunden:', user.email, 'ID:', user.id)

    // Für Vercel: Einfache Antwort ohne dauerhafte Verbindung
    // SSE funktioniert nicht gut mit Serverless Functions
    console.log('SSE: Vercel-Umgebung erkannt - sende einmalige Antwort')
    
    const responseData = {
      type: 'connected',
      message: 'Verbindung hergestellt (Vercel-Modus)',
      userId: user.id,
      timestamp: new Date().toISOString(),
      note: 'SSE wird durch Polling ersetzt in Vercel-Umgebung'
    }
    
    const message = `data: ${JSON.stringify(responseData)}\n\n`
    
    return new Response(message, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
        'Access-Control-Allow-Methods': 'GET'
      }
    })
  } catch (error) {
    console.error('SSE-Fehler:', error)
    return NextResponse.json({ error: 'SSE-Fehler' }, { status: 500 })
  }
}

