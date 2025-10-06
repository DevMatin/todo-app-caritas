'use client'

import { useState, useEffect } from 'react'

export default function TestSSEPage() {
  const [messages, setMessages] = useState<string[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Test SSE: Starte Verbindung...')
    
    const eventSource = new EventSource('/api/test-sse')
    
    eventSource.onopen = () => {
      console.log('Test SSE: Verbindung hergestellt')
      setConnected(true)
      setError(null)
    }
    
    eventSource.onmessage = (event) => {
      console.log('Test SSE: Nachricht empfangen:', event.data)
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${data.type} - ${data.message}`])
    }
    
    eventSource.onerror = (error) => {
      console.error('Test SSE: Fehler:', error)
      setError('Verbindungsfehler')
      setConnected(false)
    }
    
    return () => {
      console.log('Test SSE: Verbindung wird getrennt')
      eventSource.close()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">SSE Test</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Verbindungsstatus</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{connected ? 'Verbunden' : 'Nicht verbunden'}</span>
          </div>
          {error && (
            <div className="mt-2 text-red-600">
              Fehler: {error}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Nachrichten</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500">Keine Nachrichten empfangen...</p>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm font-mono">
                  {message}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Zurück zur Hauptseite
          </a>
        </div>
      </div>
    </div>
  )
}
