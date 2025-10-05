import { NextRequest, NextResponse } from 'next/server'

// GET /api/webhooks/n8n - Health Check
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook ist aktiv',
    timestamp: new Date().toISOString(),
    methods: ['GET', 'POST']
  })
}

// POST /api/webhooks/n8n - Eingehender Webhook von n8n
export async function POST(request: NextRequest) {
  try {
    // Token-Verifizierung für eingehende Webhooks
    const token = request.headers.get('X-Webhook-Token')
    const expectedToken = process.env.INBOUND_WEBHOOK_TOKEN
    
    if (!token || !expectedToken || token !== expectedToken) {
      console.log('Webhook: Ungültiger oder fehlender Token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Webhook empfangen:', { event: body.event })

    // Planka-Daten extrahieren
    const card = body.data?.item
    const included = body.data?.included
    
    // Aktuelle Liste finden
    const currentList = included?.lists?.find((list: any) => list.id === card?.listId)
    const listName = currentList ? currentList.name : 'Unbekannt'
    
    // Priorität aus Listen-Name ableiten
    let priority = 'mittel'
    if (listName === 'Priorität 1') priority = 'hoch'
    else if (listName === 'Priorität 2') priority = 'mittel'
    else if (listName === 'Priorität 3') priority = 'niedrig'

    // Status aus Listen-Name mappen
    let status = 'offen'
    if (listName === 'Priorität 1') status = 'in_bearbeitung'
    else if (listName === 'Erledigt') status = 'erledigt'

    // Deadline parsen falls vorhanden
    const deadline = card?.dueDate ? new Date(card.dueDate) : null

    console.log(`Webhook: Verarbeite ${body.event} - Card: ${card?.name}, Liste: ${listName}, Status: ${status}, Priorität: ${priority}`)

    // Erfolgreiche Antwort
    return NextResponse.json({ 
      message: 'Webhook erfolgreich verarbeitet',
      event: body.event,
      card: {
        id: card?.id,
        name: card?.name,
        description: card?.description,
        deadline: deadline,
        listName: listName,
        priority: priority,
        status: status
      },
      user: {
        email: body.user?.email,
        name: body.user?.name
      },
      timestamp: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('Webhook-Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Server-Fehler' 
    }, { status: 500 })
  }
}