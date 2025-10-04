import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// GET /api/tasks/[id] - Einzelne Aufgabe abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const task = await prisma.task.update({
      where: { id: params.id },
      data: body
    })

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

    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Aufgabe erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Aufgabe' }, { status: 500 })
  }
}

