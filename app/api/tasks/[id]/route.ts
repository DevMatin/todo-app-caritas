import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { sendN8nEvent, createTaskData, getChangedFields } from '@/lib/webhook'

// GET /api/tasks/[id] - Einzelne Aufgabe abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    // TEMPORÄR: Verwende Test-User wenn keine Session vorhanden
    let userEmail = session?.user?.email
    
    if (!userEmail) {
      console.log('API /tasks/[id] GET - Keine Session, verwende Test-User')
      userEmail = 'faal@caritas-erlangen.de' // Test-User E-Mail
    }

    // User-ID aus der Datenbank holen basierend auf E-Mail
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.log('API /tasks/[id] GET - User nicht in Datenbank gefunden für:', userEmail)
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const task = await prisma.task.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Fehler beim Laden der Aufgabe:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Aufgabe' }, { status: 500 })
  }
}

// PUT /api/tasks/[id] - Aufgabe aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    // TEMPORÄR: Verwende Test-User wenn keine Session vorhanden
    let userEmail = session?.user?.email
    
    if (!userEmail) {
      console.log('API /tasks/[id] PUT - Keine Session, verwende Test-User')
      userEmail = 'faal@caritas-erlangen.de' // Test-User E-Mail
    }

    // User-ID aus der Datenbank holen basierend auf E-Mail
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.log('API /tasks/[id] PUT - User nicht in Datenbank gefunden für:', userEmail)
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    
    // Prüfen ob Task existiert und dem User gehört
    const existingTask = await prisma.task.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 })
    }

    // Diff für Events bilden
    const changedFields = getChangedFields(existingTask, body)
    const previousStatus = existingTask.status

    const task = await prisma.task.update({
      where: { id: params.id },
      data: body
    })

    // Events an n8n senden (asynchron, nicht blockierend)
    const taskData = createTaskData(task, user.email)
    
    // Webhooks im Hintergrund senden (nicht await verwenden)
    sendN8nEvent('taskUpdate', taskData, {
      changedFields,
      previous: existingTask
    }).catch(error => {
      console.error('Fehler beim Senden des taskUpdate Events:', error)
    })

    // Zusätzliches StatusChange-Event wenn Status geändert wurde
    if (changedFields.includes('status') && previousStatus !== task.status) {
      sendN8nEvent('taskStatusChange', taskData, {
        changedFields: ['status'],
        previous: { status: previousStatus }
      }).catch(error => {
        console.error('Fehler beim Senden des taskStatusChange Events:', error)
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Aufgabe:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Aufgabe' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Aufgabe löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    // TEMPORÄR: Verwende Test-User wenn keine Session vorhanden
    let userEmail = session?.user?.email
    
    if (!userEmail) {
      console.log('API /tasks/[id] DELETE - Keine Session, verwende Test-User')
      userEmail = 'faal@caritas-erlangen.de' // Test-User E-Mail
    }

    // User-ID aus der Datenbank holen basierend auf E-Mail
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.log('API /tasks/[id] DELETE - User nicht in Datenbank gefunden für:', userEmail)
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfen ob Task existiert und dem User gehört
    const existingTask = await prisma.task.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 })
    }

    // Task-Daten für Event vor dem Löschen erstellen
    const taskData = createTaskData(existingTask, user.email)

    await prisma.task.delete({
      where: { id: params.id }
    })

    // Delete-Event an n8n senden
    await sendN8nEvent('taskDelete', taskData)

    return NextResponse.json({ message: 'Aufgabe erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Aufgabe' }, { status: 500 })
  }
}

