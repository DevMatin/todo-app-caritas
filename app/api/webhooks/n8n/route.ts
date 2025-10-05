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
    console.log('Webhook empfangen:', { event: body.event, data: body.data })

    const { event, data, prevData, user: plankaUser } = body

    // Validierung der Payload-Struktur
    if (!event || !data || !plankaUser) {
      return NextResponse.json({ 
        error: 'Ungültige Payload-Struktur' 
      }, { status: 400 })
    }

    // Planka-Daten extrahieren
    const card = data.item
    const included = data.included
    
    // Aktuelle Liste finden
    const currentList = included.lists.find((list: any) => list.id === card.listId)
    const listName = currentList ? currentList.name : 'Unbekannt'
    
    // Status-Mapping aus Umgebungsvariable
    const listToStatusMapping = JSON.parse(
      process.env.PLANKA_LIST_TO_STATUS || 
      '{"Priorität 1":"in_bearbeitung","Priorität 2":"offen","Priorität 3":"offen","Erledigt":"erledigt","Offen":"offen","In Bearbeitung":"in_bearbeitung"}'
    )

    // Priorität aus Listen-Name ableiten (exakte Übereinstimmung)
    let priority = 'mittel'
    if (listName === 'Priorität 1') priority = 'hoch'
    else if (listName === 'Priorität 2') priority = 'mittel'
    else if (listName === 'Priorität 3') priority = 'niedrig'
    else if (listName.includes('hoch') || listName.includes('Hoch')) priority = 'hoch'
    else if (listName.includes('niedrig') || listName.includes('Niedrig')) priority = 'niedrig'

    // Status aus Listen-Name mappen
    const status = listToStatusMapping[listName] || 'offen'

    // Deadline parsen falls vorhanden
    const deadline = card.dueDate ? new Date(card.dueDate) : null

    console.log(`Webhook: Verarbeite ${event} - Card: ${card.name}, Liste: ${listName}, Status: ${status}, Priorität: ${priority}`)
    console.log(`Webhook: Card Details - ID: ${card.id}, Deadline: ${deadline}, Beschreibung: ${card.description}`)

    // Erfolgreiche Antwort ohne Datenbank-Operation
    return NextResponse.json({ 
      message: 'Webhook erfolgreich verarbeitet',
      event: event,
      card: {
        id: card.id,
        name: card.name,
        description: card.description,
        deadline: deadline,
        listName: listName,
        priority: priority,
        status: status
      },
      user: {
        email: plankaUser.email,
        name: plankaUser.name
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Webhook-Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Server-Fehler' 
    }, { status: 500 })
  }
}

async function handleCardCreate(userId: string, card: any, status: string, priority: string, deadline: Date | null) {
  try {
    const task = await prisma.task.create({
      data: {
        title: card.name, // Planka verwendet 'name' statt 'title'
        description: card.description || null,
        status: status,
        priority: priority,
        deadline: deadline,
        externalId: card.id, // Planka Card ID speichern
        userId: userId
      }
    })

    console.log(`Webhook: Task erstellt - ID: ${task.id}, Titel: ${task.title}`)
    return NextResponse.json({ 
      message: 'Task erfolgreich erstellt',
      taskId: task.id 
    }, { status: 201 })

  } catch (error) {
    console.error('Fehler beim Erstellen der Task:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Erstellen der Task' 
    }, { status: 500 })
  }
}

async function handleCardUpdate(userId: string, card: any, status: string, priority: string, deadline: Date | null, prevData?: any) {
  try {
    // Task per externalId (Planka Card ID) finden, falls vorhanden
    let existingTask = await prisma.task.findFirst({
      where: {
        externalId: card.id,
        userId: userId
      }
    })

    // Fallback: Task per Titel und User-ID finden (für bestehende Tasks ohne externalId)
    if (!existingTask) {
      existingTask = await prisma.task.findFirst({
        where: {
          title: card.name, // Planka verwendet 'name'
          userId: userId
        }
      })
    }

    if (!existingTask) {
      console.log(`Webhook: Task nicht gefunden für Update - erstelle neue Task für Card ID: ${card.id}, Name: ${card.name}`)
      // Erstelle neue Task wenn keine gefunden wird
      return await handleCardCreate(userId, card, status, priority, deadline)
    }

    const updatedTask = await prisma.task.update({
      where: { id: existingTask.id },
      data: {
        title: card.name, // Planka verwendet 'name'
        description: card.description || null,
        status: status,
        priority: priority,
        deadline: deadline,
        externalId: card.id // External ID aktualisieren falls noch nicht gesetzt
      }
    })

    console.log(`Webhook: Task aktualisiert - ID: ${updatedTask.id}, Status: ${status}, Priorität: ${priority}`)
    console.log(`Webhook: Task Details - Titel: ${updatedTask.title}, Deadline: ${updatedTask.deadline}`)
    return NextResponse.json({ 
      message: 'Task erfolgreich aktualisiert',
      taskId: updatedTask.id,
      status: updatedTask.status,
      priority: updatedTask.priority
    })

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Task:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Aktualisieren der Task' 
    }, { status: 500 })
  }
}

async function handleCardDelete(userId: string, card: any) {
  try {
    // Task per externalId (Planka Card ID) finden, falls vorhanden
    let existingTask = await prisma.task.findFirst({
      where: {
        externalId: card.id,
        userId: userId
      }
    })

    // Fallback: Task per Titel und User-ID finden (für bestehende Tasks ohne externalId)
    if (!existingTask) {
      existingTask = await prisma.task.findFirst({
        where: {
          title: card.name, // Planka verwendet 'name'
          userId: userId
        }
      })
    }

    if (!existingTask) {
      console.log(`Webhook: Task nicht gefunden für Delete - Card ID: ${card.id}, Name: ${card.name}`)
      return NextResponse.json({ 
        error: 'Task nicht gefunden' 
      }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id: existingTask.id }
    })

    console.log(`Webhook: Task gelöscht - ID: ${existingTask.id}`)
    return NextResponse.json({ 
      message: 'Task erfolgreich gelöscht',
      taskId: existingTask.id 
    })

  } catch (error) {
    console.error('Fehler beim Löschen der Task:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Löschen der Task' 
    }, { status: 500 })
  }
}

// Fallback für andere HTTP-Methoden
export async function PUT(request: NextRequest) {
  return NextResponse.json({ 
    error: 'PUT-Methode nicht unterstützt. Verwenden Sie POST für Webhook-Anfragen.' 
  }, { status: 405 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: 'DELETE-Methode nicht unterstützt. Verwenden Sie POST für Webhook-Anfragen.' 
  }, { status: 405 })
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ 
    error: 'PATCH-Methode nicht unterstützt. Verwenden Sie POST für Webhook-Anfragen.' 
  }, { status: 405 })
}
