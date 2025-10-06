// In-Memory Store für aktive SSE-Verbindungen
const connections = new Map<string, ReadableStreamDefaultController>()

// Funktion zum Senden von Updates an einen spezifischen User
export function broadcastUpdate(userId: string, data: any) {
  const controller = connections.get(userId)
  if (controller) {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      controller.enqueue(new TextEncoder().encode(message))
      console.log('SSE: Update gesendet an User:', userId, 'Data:', data.type)
    } catch (error) {
      console.error('SSE: Fehler beim Senden des Updates:', error)
      // Verbindung entfernen bei Fehler
      connections.delete(userId)
    }
  }
}

// Funktion zum Senden von Updates an alle verbundenen Clients
export function broadcastToAll(data: any) {
  for (const [userId, controller] of connections.entries()) {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      controller.enqueue(new TextEncoder().encode(message))
      console.log('SSE: Update gesendet an alle User:', data.type)
    } catch (error) {
      console.error('SSE: Fehler beim Senden des Updates an User:', userId, error)
      // Verbindung entfernen bei Fehler
      connections.delete(userId)
    }
  }
}

// Funktion zum Hinzufügen einer neuen Verbindung
export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller)
  console.log('SSE: Verbindung hinzugefügt für User:', userId)
}

// Funktion zum Entfernen einer Verbindung
export function removeConnection(userId: string) {
  connections.delete(userId)
  console.log('SSE: Verbindung entfernt für User:', userId)
}

// Funktion zum Abrufen der Anzahl aktiver Verbindungen
export function getConnectionCount() {
  return connections.size
}
