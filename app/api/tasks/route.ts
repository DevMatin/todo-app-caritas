import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { sendN8nEvent, createTaskData } from '@/lib/webhook'
import { broadcastUpdate } from '@/lib/sse'

// Force Node.js runtime to avoid Edge Runtime issues with Prisma and Supabase
export const runtime = 'nodejs'

// GET /api/tasks - Alle Aufgaben des eingeloggten Users abrufen
export async function GET() {
  try {
    console.log('API /tasks - Starte GET-Request')
    
    // Prüfe Umgebungsvariablen
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('API /tasks - Supabase-Umgebungsvariablen fehlen')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    console.log('API /tasks - Versuche Authentifizierung...')
    const authResult = await getAuthenticatedUser()
    
    if (!authResult) {
      console.log('API /tasks - Keine authentifizierte Session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { dbUser } = authResult
    console.log('API /tasks - Authentifizierter User:', dbUser.email)

    // Verwende Prisma für Datenbank-Operationen
    console.log('API /tasks - Starte Datenbankabfrage...')
    const tasks = await prisma.task.findMany({
      where: {
        userId: dbUser.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('API /tasks - Gefundene Aufgaben:', tasks.length) // Debug-Log
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('API /tasks - Fehler beim Laden der Aufgaben:', error)
    console.error('API /tasks - Fehler-Details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json({ 
      error: 'Fehler beim Laden der Aufgaben',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// POST /api/tasks - Neue Aufgabe erstellen
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser()
    
    if (!authResult) {
      console.log('API /tasks POST - Keine authentifizierte Session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { dbUser } = authResult
    console.log('API /tasks POST - Authentifizierter User:', dbUser.email)

    const body = await request.json()
    
    // Verwende Prisma für Datenbank-Operationen
    const task = await prisma.task.create({
      data: {
        ...body,
        userId: dbUser.id
      }
    })

    // Event an n8n senden
    const taskData = createTaskData(task, dbUser.email)
    await sendN8nEvent('taskCreate', taskData)

    // SSE-Update an Frontend senden
    try {
      broadcastUpdate(dbUser.id, {
        type: 'task_updated',
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          label: task.label,
          deadline: task.deadline,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          externalId: task.externalId,
          userId: task.userId
        },
        event: 'taskCreate',
        timestamp: new Date().toISOString()
      })
      console.log('SSE: Task-Erstellung Update gesendet für User:', dbUser.id)
    } catch (sseError) {
      console.error('SSE: Fehler beim Senden des Task-Erstellung Updates:', sseError)
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Aufgabe' }, { status: 500 })
  }
}

