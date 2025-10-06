import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { broadcastUpdate } from '@/lib/sse'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

// In-Memory Store für verarbeitete Webhooks (Idempotenz)
const processedWebhooks = new Set<string>()

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
    console.log('Webhook: VOLLSTÄNDIGE n8n-DATEN:', JSON.stringify(body, null, 2))
    
    // Idempotenz-Prüfung: Erstelle einen eindeutigen Hash für diese Webhook-Anfrage
    const webhookId = `${body.event}-${body.card?.id || body.data?.cardId}-${body.timestamp || new Date().toISOString()}`
    console.log('Webhook: Eindeutige ID für Idempotenz:', webhookId)
    
    // Prüfe ob dieser Webhook bereits verarbeitet wurde
    if (processedWebhooks.has(webhookId)) {
      console.log('Webhook: Bereits verarbeitet - ignoriere Duplikat:', webhookId)
      return NextResponse.json({ 
        message: 'Webhook bereits verarbeitet (Duplikat ignoriert)',
        webhookId: webhookId,
        timestamp: new Date().toISOString()
      }, { status: 200 })
    }
    
    // Markiere Webhook als verarbeitet
    processedWebhooks.add(webhookId)
    
    // Cleanup: Entferne alte Einträge (älter als 1 Stunde)
    if (processedWebhooks.size > 1000) {
      console.log('Webhook: Cleanup der Idempotenz-Liste (zu viele Einträge)')
      processedWebhooks.clear()
    }
    
    // Zusätzliche Debugging-Informationen
    console.log('Webhook: Body-Keys:', Object.keys(body))
    console.log('Webhook: Hat body.card?', !!body.card)
    console.log('Webhook: Hat body.data?', !!body.data)
    console.log('Webhook: Hat body.user?', !!body.user)
    console.log('Webhook: Event-Typ:', body.event)

    // Planka-Daten extrahieren - verschiedene Event-Typen handhaben
    let card: any, included: any, listName: string, labelData: any
    
    // Prüfe ob n8n-Daten direkt im body stehen (nicht in body.data)
    if (body.card && body.user) {
      console.log('Webhook: n8n-Daten erkannt - verarbeite direktes Format')
      card = body.card
      listName = body.card.listName || body.card.priority
      console.log(`Webhook: n8n-Format - Card: ${card.name}, Liste: ${listName}`)
    } else if (body.event === 'actionCreate' && body.data?.item?.type === 'moveCard') {
      // Für actionCreate Events (moveCard)
      const actionData = body.data.item.data
      card = {
        id: body.data.cardId,
        name: actionData.card.name,
        description: '', // Nicht in actionCreate verfügbar
        dueDate: null,   // Nicht in actionCreate verfügbar
        listId: actionData.toList.id
      }
      included = body.data.included
      listName = actionData.toList.name
      console.log(`Webhook: moveCard Event - Card ${card.name} von "${actionData.fromList.name}" zu "${actionData.toList.name}"`)
    } else if (body.event === 'cardLabelCreate') {
      // Für cardLabelCreate Events
      card = body.data?.included?.cards?.[0]
      included = body.data?.included
      labelData = body.data?.included?.labels?.[0]
      
      // Aktuelle Liste finden
      const currentList = included?.lists?.find((list: any) => list.id === card?.listId)
      listName = currentList ? currentList.name : 'Unbekannt'
      console.log(`Webhook: cardLabelCreate Event - Card ${card?.name}, Label: ${labelData?.name} (${labelData?.color})`)
    } else {
      // Für cardUpdate Events (Standard)
      card = body.data?.item
      included = body.data?.included
      
      // Aktuelle Liste finden
      const currentList = included?.lists?.find((list: any) => list.id === card?.listId)
      listName = currentList ? currentList.name : 'Unbekannt'
    }
    
    // Priorität aus Listen-Name ableiten (behalte Planka-Namen)
    let priority = 'Priorität 2' // Default
    if (listName === 'Priorität 1') priority = 'Priorität 1'
    else if (listName === 'Priorität 2') priority = 'Priorität 2'
    else if (listName === 'Priorität 3') priority = 'Priorität 3'
    else if (listName.includes('hoch') || listName.includes('Hoch')) priority = 'Priorität 1'
    else if (listName.includes('niedrig') || listName.includes('Niedrig')) priority = 'Priorität 3'

    // Status aus Listen-Name mappen
    let status = 'offen'
    if (listName === 'Priorität 1') status = 'in_bearbeitung'
    else if (listName === 'Erledigt') status = 'erledigt'

    // Deadline parsen falls vorhanden
    let deadline = null
    if (card?.dueDate) {
      try {
        deadline = new Date(card.dueDate)
        // Prüfen ob das Datum gültig ist
        if (isNaN(deadline.getTime())) {
          console.log(`Webhook: Ungültiges Datum - ${card.dueDate}`)
          deadline = null
        }
      } catch (error) {
        console.log(`Webhook: Fehler beim Parsen des Datums - ${card.dueDate}`)
        deadline = null
      }
    }

    // Priority-Label für UI generieren
    const getPriorityLabel = (priority: string) => {
      switch (priority) {
        case 'Priorität 1': return 'hoch'
        case 'Priorität 2': return 'mittel'
        case 'Priorität 3': return 'niedrig'
        default: return 'mittel'
      }
    }
    
    const priorityLabel = getPriorityLabel(priority)
    
    // Label aus Label-Daten ableiten (für cardLabelCreate Events)
    let labelValue = null
    if (body.event === 'cardLabelCreate' && labelData) {
      // Mappe Planka Label-Namen zu unseren Label-Werten
      const labelName = labelData.name.toLowerCase()
      if (labelName === 'dringend') labelValue = 'Dringend'
      else if (labelName === 'mittel') labelValue = 'Mittel'
      else if (labelName === 'offen') labelValue = 'Offen'
      else labelValue = labelData.name // Fallback: verwende Original-Name
      
      console.log(`Webhook: Label gesetzt - ${labelValue} (aus Planka Label: ${labelData.name})`)
    }
    
    console.log(`Webhook: Verarbeite ${body.event} - Card: ${card?.name}, Liste: ${listName}, Status: ${status}, Priorität: ${priority} (Label: ${priorityLabel}), Label: ${labelValue || 'keine'}`)
    
    // Zusätzliche Logging für actionCreate Events
    if (body.event === 'actionCreate' && body.data?.item?.type === 'moveCard') {
      const actionData = body.data.item.data
      console.log(`Webhook: moveCard Details - Von: "${actionData.fromList.name}" (${actionData.fromList.id}) zu: "${actionData.toList.name}" (${actionData.toList.id})`)
    }

    // Erfolgreiche Antwort vorbereiten
    const response: any = {
      message: 'Webhook erfolgreich verarbeitet',
      event: body.event,
      card: {
        id: card?.id,
        name: card?.name,
        description: card?.description,
        deadline: deadline,
        listName: listName,
        priority: priority,
        priorityLabel: priorityLabel,
        label: labelValue,
        status: status
      },
      user: {
        email: body.user?.email,
        name: body.user?.name
      },
      timestamp: new Date().toISOString()
    }

    // Versuche Datenbank-Operationen mit Supabase
    let task = null
    let user = null
    try {
        // Prüfe Supabase-Konfiguration
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('Webhook: Supabase-Konfiguration fehlt!')
          console.error('Webhook: NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Gesetzt' : 'FEHLT')
          console.error('Webhook: SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Gesetzt' : 'FEHLT')
          throw new Error('Supabase-Konfiguration unvollständig. Bitte setzen Sie NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in .env.local')
        }
        
        // Verwende Supabase-Client mit Service Role Key für Datenbank-Operationen
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        console.log('Webhook: Supabase-Verbindung getestet')
        console.log('Webhook: Supabase URL:', supabaseUrl)
        console.log('Webhook: Service Role Key vorhanden:', supabaseKey ? 'Ja' : 'Nein')
      
      // User finden oder erstellen
      let { data: foundUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', body.user?.email)
        .single()

      if (userError || !foundUser) {
        console.log(`Webhook: User nicht gefunden - erstelle neuen User für E-Mail: ${body.user?.email}`)
        // Für Webhook-User: Generiere eine UUID als ID (da kein Supabase Auth User)
        const webhookUserId = uuidv4()
        
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            id: webhookUserId,
            email: body.user?.email,
            name: body.user?.name || body.user?.email?.split('@')[0]
          })
          .select()
          .single()
        
        if (createUserError) {
          console.error('Webhook: Fehler beim Erstellen des Users:', createUserError)
          throw createUserError
        }
        
        user = newUser
        console.log(`Webhook: Neuer User erstellt - ID: ${user.id}`)
      } else {
        user = foundUser
      }

      // Task finden oder erstellen
      const { data: existingTask, error: taskFindError } = await supabase
        .from('tasks')
        .select('*')
        .eq('external_id', card?.id)
        .eq('user_id', user.id)
        .single()

      if (taskFindError && taskFindError.code !== 'PGRST116') {
        console.error('Webhook: Fehler beim Suchen der Task:', taskFindError)
        console.error('Webhook: Task-Fehler-Details:', {
          code: taskFindError.code,
          message: taskFindError.message,
          details: taskFindError.details,
          hint: taskFindError.hint
        })
        throw taskFindError
      }

      if (!existingTask) {
        console.log(`Webhook: Task nicht gefunden - erstelle neue Task für Card: ${card?.name}`)
        
        const { data: newTask, error: createTaskError } = await supabase
          .from('tasks')
          .insert({
            id: uuidv4(), // Generiere UUID für Task-ID
            title: card?.name,
            description: card?.description || '',
            status: status,
            priority: priority,
            label: labelValue || priorityLabel, // Verwende Label-Wert oder Priority-Label als Fallback
            deadline: deadline,
            external_id: card?.id,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (createTaskError) {
          console.error('Webhook: Fehler beim Erstellen der Task:', createTaskError)
          throw createTaskError
        }
        
        task = newTask
        console.log(`Webhook: Neue Task erstellt - ID: ${task.id}`)
      } else {
        console.log(`Webhook: Task gefunden - aktualisiere Task ID: ${existingTask.id}`)
        
        // Immer alle relevanten Felder aktualisieren
        const updateData: any = {
          status: status,
          priority: priority,
          label: labelValue || priorityLabel, // Verwende Label-Wert oder Priority-Label als Fallback
          updated_at: new Date().toISOString() // Aktualisiere Zeitstempel
        }
        
        // Bei cardUpdate Events auch Titel, Beschreibung und Deadline aktualisieren
        if (body.event === 'cardUpdate') {
          updateData.title = card?.name
          updateData.description = card?.description
          updateData.deadline = deadline
          updateData.external_id = card?.id
        }
        
        // Bei cardLabelCreate Events nur Label aktualisieren (falls vorhanden)
        if (body.event === 'cardLabelCreate' && labelValue) {
          updateData.label = labelValue
        }
        
        console.log(`Webhook: Update-Daten für Task ${existingTask.id}:`, updateData)
        console.log(`Webhook: Vorherige Priorität: ${existingTask.priority}`)
        console.log(`Webhook: Neue Priorität: ${updateData.priority}`)
        console.log(`Webhook: Liste-Name: ${listName}`)
        console.log(`Webhook: Event-Typ: ${body.event}`)
        
        // Zusätzliche Validierung der Prioritäts-Daten
        if (!updateData.priority || !['Priorität 1', 'Priorität 2', 'Priorität 3'].includes(updateData.priority)) {
          console.error(`Webhook: Ungültige Priorität: ${updateData.priority}`)
          console.error(`Webhook: Liste-Name war: ${listName}`)
          updateData.priority = 'Priorität 2' // Fallback
        }
        
        const { data: updatedTask, error: updateTaskError } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', existingTask.id)
          .select()
          .single()
        
        if (updateTaskError) {
          console.error('Webhook: Fehler beim Aktualisieren der Task:', updateTaskError)
          console.error('Webhook: Update-Daten die fehlgeschlagen sind:', updateData)
          console.error('Webhook: Task-ID die aktualisiert werden sollte:', existingTask.id)
          console.error('Webhook: Supabase-Fehler-Details:', {
            code: updateTaskError.code,
            message: updateTaskError.message,
            details: updateTaskError.details,
            hint: updateTaskError.hint
          })
          throw updateTaskError
        }
        
        if (!updatedTask) {
          console.error('Webhook: Keine Task nach Update erhalten - möglicherweise wurde keine Task aktualisiert')
          console.error('Webhook: Das bedeutet, dass der Update-Befehl fehlgeschlagen ist!')
          throw new Error('Keine Task nach Update erhalten')
        }
        
        task = updatedTask
        console.log(`Webhook: Task erfolgreich aktualisiert - ID: ${task.id}, Event: ${body.event}`)
        console.log(`Webhook: Aktualisierte Priorität: ${task.priority}, Status: ${task.status}`)
      }
    } catch (dbError) {
      console.error('Webhook: Datenbank-Fehler:', dbError)
      console.error('Webhook: Fehler-Details:', {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        code: (dbError as any)?.code || 'unknown',
        stack: dbError instanceof Error ? dbError.stack : undefined
      })
      
      // Fehler in Response hinzufügen für Debugging
      response.error = {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        code: (dbError as any)?.code || 'unknown',
        details: dbError
      }
      
      console.log('Webhook: Datenbank-Fehler - Webhook schlägt fehl!')
      
      // Fehler weiterleiten statt zu simulieren
      return NextResponse.json({ 
        error: 'Datenbank-Fehler beim Verarbeiten des Webhooks',
        details: dbError instanceof Error ? dbError.message : String(dbError),
        card: response.card
      }, { status: 500 })
    }

    // Task-Informationen hinzufügen falls verfügbar
    if (task) {
      response.task = {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        label: task.label,
        deadline: task.deadline
      }

      // Echtzeit-Update an Frontend senden
      try {
        broadcastUpdate(user.id, {
          type: 'task_updated',
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            label: task.label,
            deadline: task.deadline,
            created_at: task.created_at,
            updated_at: task.updated_at,
            external_id: task.external_id,
            user_id: task.user_id
          },
          event: body.event,
          timestamp: new Date().toISOString()
        })
        console.log('SSE: Echtzeit-Update gesendet für Task:', task.id)
      } catch (sseError) {
        console.error('SSE: Fehler beim Senden des Echtzeit-Updates:', sseError)
        // SSE-Fehler soll den Webhook nicht zum Scheitern bringen
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Webhook-Fehler:', error)
    console.error('Webhook-Fehler-Details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'Interner Server-Fehler',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}