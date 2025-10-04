'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Task } from '@prisma/client'
import { TaskCard } from '@/components/TaskCard'
import { TaskModal } from '@/components/TaskModal'
import { Button } from '@/components/ui/button'
import { Plus, LogOut } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'prio1' | 'prio2' | 'prio3'>('prio1')

  // Aufgaben laden
  const fetchTasks = async () => {
    if (!session) {
      console.log('Keine Session vorhanden, überspringe Aufgaben-Laden')
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
      console.log('Geladene Aufgaben:', tasksArray) // Debug-Log
      setTasks(tasksArray)
    } catch (error) {
      console.error('Fehler beim Laden der Aufgaben:', error)
      setTasks([]) // Leeres Array als Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      // Session wird noch geladen
      return
    }
    
    if (status === 'unauthenticated') {
      // Benutzer ist nicht angemeldet
      setLoading(false)
      return
    }
    
    // Session ist verfügbar, Aufgaben laden
    fetchTasks()
  }, [session, status])

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
  
  const filteredTasks = safeTasks.filter(task => {
    if (!task) return false
    
    const matches = (() => {
      switch (filter) {
        case 'prio1':
          return task.priority === 'hoch' || task.priority === 'dringend'
        case 'prio2':
          return task.priority === 'mittel'
        case 'prio3':
          return task.priority === 'niedrig'
        default:
          return true
      }
    })()
    
    console.log(`Task "${task.title}" mit Priorität "${task.priority}" für Filter "${filter}": ${matches}`)
    return matches
  })

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
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nicht angemeldet</h1>
          <p className="text-gray-600 mb-6">Sie müssen sich anmelden, um Ihre Aufgaben zu sehen.</p>
          <Button onClick={() => window.location.href = '/login'}>
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
                  Hallo, {session?.user?.name || session?.user?.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
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

        {/* Tasks Container */}
        <div className="bg-white border border-gray-300 rounded-lg min-h-[400px] p-6">
          {filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">
                Es sind momentan keine Aufgaben in Priorität {filter === 'prio1' ? '1' : filter === 'prio2' ? '2' : '3'} vorhanden
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
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

