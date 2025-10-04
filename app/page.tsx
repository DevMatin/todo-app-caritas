'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Task } from '@prisma/client'
import { TaskCard } from '@/components/TaskCard'
import { TaskModal } from '@/components/TaskModal'
import { Button } from '@/components/ui/button'
import { Plus, LogOut } from 'lucide-react'

export default function HomePage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'all' | 'offen' | 'in_bearbeitung' | 'erledigt'>('all')

  // Aufgaben laden
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Fehler beim Laden der Aufgaben:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

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

  // Gefilterte Aufgaben
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter)

  // Statistiken
  const stats = {
    total: tasks.length,
    offen: tasks.filter(t => t.status === 'offen').length,
    inBearbeitung: tasks.filter(t => t.status === 'in_bearbeitung').length,
    erledigt: tasks.filter(t => t.status === 'erledigt').length,
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Team Aufgabenverwaltung
              </h1>
              <p className="text-gray-600">
                Verwalte Aufgaben für dein Handwerker-Team
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Hallo, {session?.user?.name || session?.user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Gesamt</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{stats.offen}</div>
            <div className="text-sm text-gray-600">Offen</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.inBearbeitung}</div>
            <div className="text-sm text-gray-600">In Bearbeitung</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.erledigt}</div>
            <div className="text-sm text-gray-600">Erledigt</div>
          </div>
        </div>

        {/* Filter und Aktionen */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              Alle
            </Button>
            <Button
              variant={filter === 'offen' ? 'default' : 'outline'}
              onClick={() => setFilter('offen')}
              size="sm"
            >
              Offen
            </Button>
            <Button
              variant={filter === 'in_bearbeitung' ? 'default' : 'outline'}
              onClick={() => setFilter('in_bearbeitung')}
              size="sm"
            >
              In Bearbeitung
            </Button>
            <Button
              variant={filter === 'erledigt' ? 'default' : 'outline'}
              onClick={() => setFilter('erledigt')}
              size="sm"
            >
              Erledigt
            </Button>
          </div>
          
          <Button
            onClick={() => {
              setEditingTask(null)
              setIsModalOpen(true)
            }}
            className="ml-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Aufgabe
          </Button>
        </div>

        {/* Aufgabenliste */}
        <div className="grid gap-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'Keine Aufgaben vorhanden' : `Keine ${filter} Aufgaben`}
              </h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? 'Erstelle deine erste Aufgabe, um loszulegen.'
                  : 'Es gibt derzeit keine Aufgaben mit diesem Status.'
                }
              </p>
              {filter === 'all' && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Erste Aufgabe erstellen
                </Button>
              )}
            </div>
          ) : (
            filteredTasks.map((task) => (
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
            ))
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

