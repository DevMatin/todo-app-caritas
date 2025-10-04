import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { Task, Priority, Status } from '@prisma/client'
import { sendN8nEvent, createTaskData } from '@/lib/webhook'

// GET /api/tasks - Alle Aufgaben des eingeloggten Users abrufen
export async function GET() {
  try {
    const session = await getServerSession()
    
    console.log('API /tasks - Session:', session) // Debug-Log
    
    if (!session?.user?.email) {
      console.log('API /tasks - Keine Session oder E-Mail fehlt')
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // User-ID aus der Datenbank holen basierend auf E-Mail
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.log('API /tasks - User nicht in Datenbank gefunden')
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    console.log('API /tasks - Gefundene Aufgaben:', tasks.length) // Debug-Log
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Fehler beim Laden der Aufgaben:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Aufgaben' }, { status: 500 })
  }
}

// POST /api/tasks - Neue Aufgabe erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // User-ID aus der Datenbank holen basierend auf E-Mail
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    
    const task = await prisma.task.create({
      data: {
        ...body,
        userId: user.id,
      }
    })

    // Event an n8n senden
    const taskData = createTaskData(task, user.email)
    await sendN8nEvent('taskCreate', taskData)

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Aufgabe' }, { status: 500 })
  }
}

