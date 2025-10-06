/**
 * Webhook-Helper für ausgehende Events an n8n
 */

interface TaskData {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  deadline: Date | null
  externalId: string | null
  userEmail: string
}

interface WebhookPayload {
  event: string
  task: TaskData
  meta?: {
    changedFields?: string[]
    previous?: Record<string, any>
    timestamp: string
  }
}

/**
 * Sendet ein Event an n8n
 * @param event Event-Typ (taskCreate, taskUpdate, taskDelete, taskStatusChange)
 * @param task Task-Daten
 * @param meta Zusätzliche Metadaten (optional)
 */
export async function sendN8nEvent(
  event: string, 
  task: TaskData, 
  meta?: Omit<WebhookPayload['meta'], 'timestamp'>
): Promise<void> {
  try {
    const webhookUrl = process.env.N8N_OUTBOUND_WEBHOOK_URL
    const token = process.env.N8N_OUTBOUND_TOKEN

    console.log('🔍 Webhook Debug Info:')
    console.log('- Webhook URL:', webhookUrl)
    console.log('- Token vorhanden:', !!token)
    console.log('- Event:', event)
    console.log('- Task ID:', task.id)

    if (!webhookUrl) {
      console.warn('❌ N8N_OUTBOUND_WEBHOOK_URL fehlt - Event wird nicht gesendet')
      return
    }

    const payload: WebhookPayload = {
      event,
      task,
      meta: {
        ...meta,
        timestamp: new Date().toISOString()
      }
    }

    console.log('📤 Sende Event an n8n:', JSON.stringify(payload, null, 2))

    // Headers mit Token-Authentifizierung
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Token hinzufügen (erforderlich für Sicherheit)
    if (token) {
      headers['X-Webhook-Token'] = token
    } else {
      console.log('⚠️ N8N_OUTBOUND_TOKEN fehlt - Webhook wird nicht gesendet')
      return
    }

    // Timeout für Webhook-Aufrufe (5 Sekunden)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`❌ N8N Webhook-Fehler: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Fehler-Details:', errorText)
    } else {
      console.log(`✅ N8N Event erfolgreich gesendet: ${event} für Task ${task.id}`)
    }

  } catch (error) {
    console.error('❌ Fehler beim Senden des N8N Events:', error)
    // Fehler werden geloggt, aber Operationen schlagen nicht fehl
  }
}

/**
 * Erstellt Task-Daten für Webhook-Payload
 * @param task Prisma Task-Objekt
 * @param userEmail E-Mail des Benutzers
 */
export function createTaskData(task: any, userEmail: string): TaskData {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    deadline: task.deadline,
    externalId: task.externalId,
    userEmail: userEmail
  }
}

/**
 * Ermittelt geänderte Felder zwischen zwei Task-Objekten
 * @param previous Vorheriger Zustand
 * @param current Aktueller Zustand
 */
export function getChangedFields(previous: any, current: any): string[] {
  const fields = ['title', 'description', 'priority', 'status', 'deadline', 'externalId']
  const changed: string[] = []

  for (const field of fields) {
    if (previous[field] !== current[field]) {
      changed.push(field)
    }
  }

  return changed
}
