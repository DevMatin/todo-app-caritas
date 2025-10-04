'use client'

import { useState, useEffect } from 'react'
import { Task } from '@prisma/client'

interface TaskInsert {
  title: string
  description?: string
  priority: 'prio1' | 'prio2' | 'prio3'
  status: 'offen' | 'in_bearbeitung' | 'erledigt'
  deadline?: string
  comment?: string
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: TaskInsert) => void
  task?: Task | null
}

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const [formData, setFormData] = useState<TaskInsert>({
    title: '',
    description: '',
    priority: 'prio2',
    status: 'offen',
    deadline: '',
    comment: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Priorität von altem Format zu neuem Format konvertieren
  const convertPriority = (oldPriority: string): 'prio1' | 'prio2' | 'prio3' => {
    switch (oldPriority) {
      case 'hoch':
      case 'dringend':
        return 'prio1'
      case 'mittel':
        return 'prio2'
      case 'niedrig':
        return 'prio3'
      default:
        return 'prio2'
    }
  }

  // Formular zurücksetzen wenn Modal geöffnet wird
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Bearbeitungsmodus
        setFormData({
          title: task.title,
          description: task.description || '',
          priority: convertPriority(task.priority),
          status: task.status,
          deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
          comment: task.comment || '',
        })
      } else {
        // Erstellungsmodus
        setFormData({
          title: '',
          description: '',
          priority: 'prio2',
          status: 'offen',
          deadline: '',
          comment: '',
        })
      }
    }
  }, [isOpen, task])

  // Priorität von neuem Format zu altem Format konvertieren (für Datenbank)
  const convertPriorityToOld = (newPriority: 'prio1' | 'prio2' | 'prio3'): string => {
    switch (newPriority) {
      case 'prio1':
        return 'hoch'
      case 'prio2':
        return 'mittel'
      case 'prio3':
        return 'niedrig'
      default:
        return 'mittel'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Formular-Daten bereinigen und Priorität konvertieren
      const cleanedData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        priority: convertPriorityToOld(formData.priority),
        status: formData.status,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        comment: formData.comment?.trim() || undefined,
      }

      await onSave(cleanedData)
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof TaskInsert, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
          </DialogTitle>
          <DialogDescription>
            {task 
              ? 'Bearbeite die Details der Aufgabe und speichere die Änderungen.'
              : 'Erstelle eine neue Aufgabe für das Team.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="z.B. Heizung reparieren"
              required
            />
          </div>

          {/* Beschreibung */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detaillierte Beschreibung der Aufgabe..."
              rows={3}
            />
          </div>

          {/* Priorität und Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorität</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priorität wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prio1">Prio 1</SelectItem>
                  <SelectItem value="prio2">Prio 2</SelectItem>
                  <SelectItem value="prio3">Prio 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offen">Offen</SelectItem>
                  <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                  <SelectItem value="erledigt">Erledigt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Fälligkeitsdatum</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
            />
          </div>

          {/* Kommentar */}
          <div className="space-y-2">
            <Label htmlFor="comment">Kommentar</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              placeholder="Zusätzliche Notizen oder Kommentare..."
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="text-white"
              style={{ backgroundColor: '#d21c1a' }}
            >
              {isSubmitting 
                ? 'Speichern...' 
                : task 
                  ? 'Änderungen speichern' 
                  : 'Aufgabe erstellen'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

