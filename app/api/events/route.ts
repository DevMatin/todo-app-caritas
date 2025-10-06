import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { addConnection, removeConnection } from '@/lib/sse'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

// Force dynamic rendering für SSE
export const dynamic = 'force-dynamic'

// SSE-Endpoint für Echtzeit-Updates
export async function GET(request: NextRequest) {
  try {
    console.log('SSE: Neue Verbindungsanfrage erhalten')
    
    // Verwende die gleiche Authentifizierung wie die Tasks-API
    console.log('SSE: Versuche Authentifizierung...')
    const authResult = await getAuthenticatedUser()
    
    if (!authResult) {
      console.log('SSE: Keine authentifizierte Session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { dbUser } = authResult
    console.log('SSE: Authentifizierter User gefunden:', dbUser.email, 'ID:', dbUser.id)

    // Für lokale Entwicklung: Echte SSE-Verbindung
    if (process.env.NODE_ENV === 'development') {
      console.log('SSE: Lokale Entwicklung - erstelle echte SSE-Verbindung')
      
      const stream = new ReadableStream({
        start(controller) {
          try {
            console.log('SSE: Starte Stream für User:', dbUser.id)
            
            // Verbindung speichern
            addConnection(dbUser.id, controller)
            
            // Willkommensnachricht senden
            const welcomeMessage = `data: ${JSON.stringify({
              type: 'connected',
              message: 'Verbindung hergestellt',
              userId: dbUser.id,
              timestamp: new Date().toISOString()
            })}\n\n`
            
            controller.enqueue(new TextEncoder().encode(welcomeMessage))
            console.log('SSE: Willkommensnachricht gesendet für User:', dbUser.id)
            
            // Heartbeat alle 30 Sekunden
            const heartbeatInterval = setInterval(() => {
              try {
                const heartbeatMessage = `data: ${JSON.stringify({
                  type: 'heartbeat',
                  timestamp: new Date().toISOString()
                })}\n\n`
                controller.enqueue(new TextEncoder().encode(heartbeatMessage))
              } catch (error) {
                console.error('SSE: Fehler beim Senden des Heartbeats:', error)
                clearInterval(heartbeatInterval)
              }
            }, 30000)
            
            console.log('SSE: Verbindung erfolgreich hergestellt für User:', dbUser.id)
          } catch (error) {
            console.error('SSE: Fehler beim Starten des Streams:', error)
          }
        },
        cancel() {
          try {
            // Verbindung entfernen
            removeConnection(dbUser.id)
            console.log('SSE: Verbindung getrennt für User:', dbUser.id)
          } catch (error) {
            console.error('SSE: Fehler beim Schließen der Verbindung:', error)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
          'Access-Control-Allow-Methods': 'GET',
          'X-Accel-Buffering': 'no'
        }
      })
    }

    // Für Vercel: Versuche SSE mit kurzer Lebensdauer
    console.log('SSE: Vercel-Umgebung - versuche SSE mit kurzer Lebensdauer')
    
    const stream = new ReadableStream({
      start(controller) {
        try {
          console.log('SSE: Starte Vercel-SSE für User:', dbUser.id)
          
          // Verbindung speichern
          addConnection(dbUser.id, controller)
          
          // Willkommensnachricht senden
          const welcomeMessage = `data: ${JSON.stringify({
            type: 'connected',
            message: 'Verbindung hergestellt (Vercel-SSE)',
            userId: dbUser.id,
            timestamp: new Date().toISOString(),
            note: 'SSE mit kurzer Lebensdauer - Polling als Fallback'
          })}\n\n`
          
          controller.enqueue(new TextEncoder().encode(welcomeMessage))
          console.log('SSE: Willkommensnachricht gesendet für User:', dbUser.id)
          
          // Kurzer Heartbeat alle 10 Sekunden (für Vercel optimiert)
          const heartbeatInterval = setInterval(() => {
            try {
              const heartbeatMessage = `data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                message: 'SSE aktiv'
              })}\n\n`
              controller.enqueue(new TextEncoder().encode(heartbeatMessage))
            } catch (error) {
              console.error('SSE: Fehler beim Senden des Heartbeats:', error)
              clearInterval(heartbeatInterval)
            }
          }, 10000)
          
          // Automatisches Schließen nach 2 Minuten (Vercel-Limit)
          setTimeout(() => {
            try {
              console.log('SSE: Automatisches Schließen nach 2 Minuten für User:', dbUser.id)
              clearInterval(heartbeatInterval)
              removeConnection(dbUser.id)
              controller.close()
            } catch (error) {
              console.error('SSE: Fehler beim automatischen Schließen:', error)
            }
          }, 120000) // 2 Minuten
          
          console.log('SSE: Vercel-SSE erfolgreich gestartet für User:', dbUser.id)
        } catch (error) {
          console.error('SSE: Fehler beim Starten des Vercel-SSE:', error)
        }
      },
      cancel() {
        try {
          // Verbindung entfernen
          removeConnection(dbUser.id)
          console.log('SSE: Vercel-SSE Verbindung getrennt für User:', dbUser.id)
        } catch (error) {
          console.error('SSE: Fehler beim Schließen der Vercel-SSE Verbindung:', error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
        'Access-Control-Allow-Methods': 'GET',
        'X-Accel-Buffering': 'no'
      }
    })
  } catch (error) {
    console.error('SSE-Fehler:', error)
    return NextResponse.json({ error: 'SSE-Fehler' }, { status: 500 })
  }
}

