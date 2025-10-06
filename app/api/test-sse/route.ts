import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Einfacher SSE-Test ohne Authentifizierung
export async function GET(request: NextRequest) {
  try {
    console.log('SSE-Test: Neue Verbindungsanfrage erhalten')
    
    const stream = new ReadableStream({
      start(controller) {
        console.log('SSE-Test: Stream gestartet')
        
        // Willkommensnachricht
        const welcomeMessage = `data: ${JSON.stringify({
          type: 'test_connected',
          message: 'Test-Verbindung hergestellt',
          timestamp: new Date().toISOString()
        })}\n\n`
        
        controller.enqueue(new TextEncoder().encode(welcomeMessage))
        
        // Test-Nachricht alle 5 Sekunden
        const testInterval = setInterval(() => {
          try {
            const testMessage = `data: ${JSON.stringify({
              type: 'test_message',
              message: 'Test-Nachricht',
              timestamp: new Date().toISOString()
            })}\n\n`
            controller.enqueue(new TextEncoder().encode(testMessage))
            console.log('SSE-Test: Test-Nachricht gesendet')
          } catch (error) {
            console.error('SSE-Test: Fehler beim Senden:', error)
            clearInterval(testInterval)
          }
        }, 5000)
        
        // Cleanup nach 60 Sekunden
        setTimeout(() => {
          clearInterval(testInterval)
          try {
            controller.close()
          } catch (error) {
            console.error('SSE-Test: Fehler beim Schließen:', error)
          }
        }, 60000)
      },
      cancel() {
        console.log('SSE-Test: Stream abgebrochen')
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'Access-Control-Allow-Methods': 'GET'
      }
    })
  } catch (error) {
    console.error('SSE-Test-Fehler:', error)
    return NextResponse.json({ error: 'SSE-Test-Fehler' }, { status: 500 })
  }
}
