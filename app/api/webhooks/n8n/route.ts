import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/webhooks/n8n - Eingehender Webhook von n8n
export async function POST(request: NextRequest) {
  try {
    // Token-Verifizierung (temporär deaktiviert für Tests)
    // const token = request.headers.get('X-Webhook-Token')
    // const expectedToken = process.env.INBOUND_WEBHOOK_TOKEN
    
    // if (!token || !expectedToken || token !== expectedToken) {
    //   console.log('Webhook: Ungültiger oder fehlender Token')
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    console.log('Webhook empfangen:', { event: body.event, data: body.data })

    const { event, data, prevData, user: plankaUser } = body

    // Validierung der Payload-Struktur
    if (!event || !data || !plankaUser) {
      return NextResponse.json({ 
        error: 'Ungültige Payload-Struktur' 
      }, { status: 400 })
    }

    // User per E-Mail finden
    const user = await prisma.user.findUnique({
      where: { email: plankaUser.email }
    })

    if (!user) {
      console.log(`Webhook: User nicht gefunden für E-Mail: ${plankaUser.email}`)
      return NextResponse.json({ 
        error: 'Benutzer nicht gefunden' 
      }, { status: 409 })
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
      '{"Offen":"offen","In Bearbeitung":"in_bearbeitung","Erledigt":"erledigt","uns":"offen","test":"in_bearbeitung"}'
    )

    // Priorität aus erstem Label ableiten (falls vorhanden)
    const priority = card.labels && card.labels.length > 0 
      ? card.labels[0].toLowerCase() 
      : 'mittel'

    // Status aus Listen-Name mappen
    const status = listToStatusMapping[listName] || 'offen'

    // Deadline parsen falls vorhanden
    const deadline = card.dueDate ? new Date(card.dueDate) : null

    console.log(`Webhook: Verarbeite ${event} - Card: ${card.name}, Liste: ${listName}, Status: ${status}`)

    switch (event) {
      case 'cardCreate':
        return await handleCardCreate(user.id, card, status, priority, deadline)
      
      case 'cardUpdate':
        return await handleCardUpdate(user.id, card, status, priority, deadline, prevData)
      
      case 'cardDelete':
        return await handleCardDelete(user.id, card)
      
      default:
        return NextResponse.json({ 
          error: `Unbekanntes Event: ${event}` 
        }, { status: 400 })
    }

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
      console.log(`Webhook: Task nicht gefunden für Update - Card ID: ${card.id}, Name: ${card.name}`)
      return NextResponse.json({ 
        error: 'Task nicht gefunden' 
      }, { status: 404 })
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

    console.log(`Webhook: Task aktualisiert - ID: ${updatedTask.id}, Status: ${status}`)
    return NextResponse.json({ 
      message: 'Task erfolgreich aktualisiert',
      taskId: updatedTask.id 
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
