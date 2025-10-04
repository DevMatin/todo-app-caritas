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
  const [filter, setFilter] = useState<'today' | 'pending' | 'overdue'>('today')

  // Aufgaben laden
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // Sicherstellen, dass data ein Array ist
      setTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fehler beim Laden der Aufgaben:', error)
      setTasks([]) // Leeres Array als Fallback
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

  // Gefilterte Aufgaben basierend auf Datum
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Sicherstellen, dass tasks ein Array ist
  const safeTasks = Array.isArray(tasks) ? tasks : []
  
  const filteredTasks = safeTasks.filter(task => {
    if (!task) return false
    
    const taskDate = new Date(task.dueDate || task.createdAt)
    taskDate.setHours(0, 0, 0, 0)
    
    switch (filter) {
      case 'today':
        return taskDate.getTime() === today.getTime()
      case 'pending':
        return taskDate.getTime() > today.getTime()
      case 'overdue':
        return taskDate.getTime() < today.getTime()
      default:
        return true
    }
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header mit grünem Hintergrund */}
      <div className="bg-green-600 bg-opacity-90 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-80"></div>
        <div className="relative px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold text-white">Todo App</h1>
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
            variant={filter === 'today' ? 'default' : 'outline'}
            onClick={() => setFilter('today')}
            className={filter === 'today' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
          >
            Today
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            onClick={() => setFilter('overdue')}
            className={filter === 'overdue' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
          >
            Overdue
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
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Tasks Container */}
        <div className="bg-white border border-gray-300 rounded-lg min-h-[400px] p-6">
          {filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">No data to display</p>
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

