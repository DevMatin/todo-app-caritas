import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { Task, Priority, Status } from '@prisma/client'

// GET /api/tasks - Alle Aufgaben des eingeloggten Users abrufen
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

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
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    
    const task = await prisma.task.create({
      data: {
        ...body,
        userId: session.user.id,
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Aufgabe' }, { status: 500 })
  }
}

