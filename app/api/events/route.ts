import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { addConnection, removeConnection } from '@/lib/sse'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

// SSE-Endpoint für Echtzeit-Updates
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { dbUser } = authResult
    console.log('SSE: Neue Verbindung für User:', dbUser.email)

    // SSE-Stream erstellen
    const stream = new ReadableStream({
      start(controller) {
        // Verbindung speichern
        addConnection(dbUser.id, controller)
        
        // Willkommensnachricht senden
        const welcomeMessage = `data: ${JSON.stringify({
          type: 'connected',
          message: 'Verbindung hergestellt',
          userId: dbUser.id
        })}\n\n`
        controller.enqueue(new TextEncoder().encode(welcomeMessage))
        
        console.log('SSE: Verbindung hergestellt für User:', dbUser.id)
      },
      cancel() {
        // Verbindung entfernen
        removeConnection(dbUser.id)
        console.log('SSE: Verbindung getrennt für User:', dbUser.id)
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

