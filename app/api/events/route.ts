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
    // Supabase-Client mit Request-Cookies erstellen
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
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('SSE: Keine authentifizierte Session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('SSE: Neue Verbindung für User:', user.email)

    // SSE-Stream erstellen
    const stream = new ReadableStream({
      start(controller) {
        // Verbindung speichern
        addConnection(user.id, controller)
        
        // Willkommensnachricht senden
        const welcomeMessage = `data: ${JSON.stringify({
          type: 'connected',
          message: 'Verbindung hergestellt',
          userId: user.id
        })}\n\n`
        controller.enqueue(new TextEncoder().encode(welcomeMessage))
        
        console.log('SSE: Verbindung hergestellt für User:', user.id)
      },
      cancel() {
        // Verbindung entfernen
        removeConnection(user.id)
        console.log('SSE: Verbindung getrennt für User:', user.id)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })
  } catch (error) {
    console.error('SSE-Fehler:', error)
    return NextResponse.json({ error: 'SSE-Fehler' }, { status: 500 })
  }
}

