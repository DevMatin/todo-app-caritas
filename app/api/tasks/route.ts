import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createClient } from '@supabase/supabase-js'
import { sendN8nEvent, createTaskData } from '@/lib/webhook'

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

    // Verwende Supabase-Client für Datenbank-Operationen
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase-Fehler beim Laden der Aufgaben:', error)
      throw error
    }

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
    
    // Verwende Supabase-Client für Datenbank-Operationen
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        ...body,
        user_id: dbUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase-Fehler beim Erstellen der Aufgabe:', error)
      throw error
    }

    // Event an n8n senden
    const taskData = createTaskData(task, dbUser.email)
    await sendN8nEvent('taskCreate', taskData)

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen der Aufgabe:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Aufgabe' }, { status: 500 })
  }
}

