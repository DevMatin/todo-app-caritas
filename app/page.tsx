'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Task } from '@prisma/client'
import { TaskCard } from '@/components/TaskCard'
import { TaskModal } from '@/components/TaskModal'
import { Button } from '@/components/ui/button'
import { Plus, LogOut, Settings } from 'lucide-react'
import { User } from '@supabase/supabase-js'

// Force dynamic rendering to avoid static generation issues with cookies
export const dynamic = 'force-dynamic'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'prio1' | 'prio2' | 'prio3'>('prio1')
  const [sseConnected, setSseConnected] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Aufgaben laden
  const fetchTasks = async () => {
    if (!user) {
      console.log('Keine User-Session vorhanden, überspringe Aufgaben-Laden')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // Sicherstellen, dass data ein Array ist
      const tasksArray = Array.isArray(data) ? data : []
      console.log('Geladene Aufgaben:', tasksArray.length, 'Aufgaben') // Debug-Log
      console.log('Aufgaben-Details:', tasksArray.map(task => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        label: task.label,
        status: task.status
      })))
      setTasks(tasksArray)
    } catch (error) {
      console.error('Fehler beim Laden der Aufgaben:', error)
      setTasks([]) // Leeres Array als Fallback
    } finally {
      setLoading(false)
    }
  }

  // SSE-Verbindung für Echtzeit-Updates
  useEffect(() => {
    if (!user) return

    console.log('SSE: Verbindung wird hergestellt für User:', user.email)
    const eventSource = new EventSource('/api/events')

    eventSource.onopen = () => {
      console.log('SSE: Verbindung hergestellt')
      setSseConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE: Nachricht empfangen:', data)

        if (data.type === 'task_updated') {
          console.log('SSE: Task-Update empfangen:', data.task)
          
          // Task in der Liste aktualisieren oder hinzufügen
          setTasks(prevTasks => {
            const existingIndex = prevTasks.findIndex(t => t.id === data.task.id)
            
            if (existingIndex >= 0) {
              // Task aktualisieren
              const updatedTasks = [...prevTasks]
              updatedTasks[existingIndex] = data.task
              console.log('SSE: Task aktualisiert in Liste:', data.task.title)
              return updatedTasks
            } else {
              // Neue Task hinzufügen
              console.log('SSE: Neue Task hinzugefügt zur Liste:', data.task.title)
              return [data.task, ...prevTasks]
            }
          })
        } else if (data.type === 'task_deleted') {
          console.log('SSE: Task-Löschung empfangen:', data.task)
          
          // Task aus der Liste entfernen
          setTasks(prevTasks => {
            const filteredTasks = prevTasks.filter(t => t.id !== data.task.id)
            console.log('SSE: Task entfernt aus Liste:', data.task.title)
            return filteredTasks
          })
        }
      } catch (error) {
        console.error('SSE: Fehler beim Verarbeiten der Nachricht:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE: Verbindungsfehler:', error)
      setSseConnected(false)
    }

    return () => {
      console.log('SSE: Verbindung wird getrennt')
      eventSource.close()
      setSseConnected(false)
    }
  }, [user])

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()
  }, [supabase.auth])

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  // Aufgabe aktualisieren
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (response.ok) {
        await fetchTasks() // Aufgaben neu laden
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Aufgabe:', error)
    }
  }

  // Aufgabe löschen
  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchTasks() // Aufgaben neu laden
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error)
    }
  }

  // Aufgabe erstellen/bearbeiten
  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask) {
        // Bearbeiten
        await updateTask(editingTask.id, taskData)
      } else {
        // Erstellen
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        })
        
        if (response.ok) {
          await fetchTasks() // Aufgaben neu laden
        }
      }
      
      setIsModalOpen(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Fehler beim Speichern der Aufgabe:', error)
    }
  }

  // Gefilterte Aufgaben basierend auf Priorität
  // Sicherstellen, dass tasks ein Array ist
  const safeTasks = Array.isArray(tasks) ? tasks : []
  
  // Filter-Funktion für Priorität
  const matchesFilter = (task: Task) => {
    if (!task) return false
    
    const matches = (() => {
      switch (filter) {
        case 'prio1':
          return task.priority === 'Priorität 1' || 
                 task.priority === 'hoch' || 
                 task.priority === 'dringend' ||
                 task.label === 'Dringend'
        case 'prio2':
          return task.priority === 'Priorität 2' || 
                 task.priority === 'mittel' ||
                 task.label === 'Mittel'
        case 'prio3':
          return task.priority === 'Priorität 3' || 
                 task.priority === 'niedrig' ||
                 task.label === 'Offen'
        default:
          return true
      }
    })()
    
    console.log(`Task "${task.title}" mit Priorität "${task.priority}" und Label "${task.label}" für Filter "${filter}": ${matches}`)
    return matches
  }
  
  // Aufteilen in aktive und erledigte Aufgaben
  const activeTasks = safeTasks.filter(task => task && task.status !== 'erledigt' && matchesFilter(task))
  const completedTasks = safeTasks.filter(task => task && task.status === 'erledigt' && matchesFilter(task))
  
  // Debug-Ausgaben für gefilterte Aufgaben
  console.log(`Filter "${filter}" - Aktive Aufgaben: ${activeTasks.length}, Erledigte: ${completedTasks.length}`)
  console.log('Aktive Aufgaben:', activeTasks.map(task => ({
    title: task.title,
    priority: task.priority,
    label: task.label,
    status: task.status
  })))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Aufgaben werden geladen...</p>
        </div>
      </div>
    )
  }

  // Wenn Benutzer nicht angemeldet ist
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nicht angemeldet</h1>
          <p className="text-gray-600 mb-6">Sie müssen sich anmelden, um Ihre Aufgaben zu sehen.</p>
          <Button onClick={() => router.push('/login')}>
            Zur Anmeldung
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header mit Corporate Design Farbe */}
      <div className="relative overflow-hidden" style={{ backgroundColor: '#d21c1a' }}>
        <div className="absolute inset-0 opacity-80" style={{ background: 'linear-gradient(to right, #d21c1a, #b01816)' }}></div>
        <div className="relative px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold text-white">Todo App Caritas</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-green-100">
                  Hallo, {user?.user_metadata?.name || user?.email}
                </span>
                {/* SSE-Verbindungsstatus */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-xs text-green-100">
                    {sseConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/settings')}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Einstellungen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/login')
                  }}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'prio1' ? 'default' : 'outline'}
            onClick={() => setFilter('prio1')}
            className={filter === 'prio1' ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            style={filter === 'prio1' ? { backgroundColor: '#d21c1a' } : {}}
          >
            Prio 1
          </Button>
          <Button
            variant={filter === 'prio2' ? 'default' : 'outline'}
            onClick={() => setFilter('prio2')}
            className={filter === 'prio2' ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            style={filter === 'prio2' ? { backgroundColor: '#d21c1a' } : {}}
          >
            Prio 2
          </Button>
          <Button
            variant={filter === 'prio3' ? 'default' : 'outline'}
            onClick={() => setFilter('prio3')}
            className={filter === 'prio3' ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            style={filter === 'prio3' ? { backgroundColor: '#d21c1a' } : {}}
          >
            Prio 3
          </Button>
        </div>

        {/* Tasks Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Tasks</h2>
          <Button
            onClick={() => {
              setEditingTask(null)
              setIsModalOpen(true)
            }}
            className="text-white"
            style={{ backgroundColor: '#d21c1a' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Aktive Tasks Container */}
        <div className="bg-white border border-gray-300 rounded-lg min-h-[400px] p-6">
          {activeTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">
                Es sind momentan keine aktiven Aufgaben in Priorität {filter === 'prio1' ? '1' : filter === 'prio2' ? '2' : '3'} vorhanden
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={(task) => {
                    setEditingTask(task)
                    setIsModalOpen(true)
                  }}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Erledigte Aufgaben Section */}
        {completedTasks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Erledigte Aufgaben</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={(task) => {
                      setEditingTask(task)
                      setIsModalOpen(true)
                    }}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal für Aufgabe bearbeiten/erstellen */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingTask(null)
          }}
          onSave={handleSaveTask}
          task={editingTask}
        />
      </div>
    </div>
  )
}

