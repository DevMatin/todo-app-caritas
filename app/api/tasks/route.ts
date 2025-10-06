import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { sendN8nEvent, createTaskData } from '@/lib/webhook'

// Force Node.js runtime to avoid Edge Runtime issues with Prisma and Supabase
export const runtime = 'nodejs'

// GET /api/tasks - Alle Aufgaben des eingeloggten Users abrufen
export async function GET() {
  try {
    const authResult = await getAuthenticatedUser()
    
    if (!authResult) {
      console.log('API /tasks - Keine authentifizierte Session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { dbUser } = authResult
    console.log('API /tasks - Authentifizierter User:', dbUser.email)

    // Verwende Prisma für Datenbank-Operationen
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
    console.error('Fehler beim Laden der Aufgaben:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Aufgaben' }, { status: 500 })
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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Aufgabe' }, { status: 500 })
  }
}

