'use client'

import { useState } from 'react'
import { Task } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Trash2, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  PlayCircle,
  Calendar
} from 'lucide-react'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
}

export function TaskCard({ task, onEdit, onUpdate, onDelete }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  // Status-Farben und Icons
  const statusConfig = {
    offen: { 
      color: 'bg-orange-100 text-orange-800', 
      icon: AlertCircle,
      label: 'Offen' 
    },
    in_bearbeitung: { 
      color: 'bg-blue-100 text-blue-800', 
      icon: PlayCircle,
      label: 'In Bearbeitung' 
    },
    erledigt: { 
      color: 'bg-green-100 text-green-800', 
      icon: CheckCircle2,
      label: 'Erledigt' 
    },
  }

  // Prioritäts-Farben (für Fallback)
  const priorityConfig = {
    niedrig: 'bg-gray-100 text-gray-800',
    mittel: 'bg-yellow-100 text-yellow-800',
    hoch: 'bg-orange-100 text-orange-800',
    dringend: 'bg-red-100 text-red-800',
  }

  // Label-Farben (Urgency-Labels aus Planka)
  const labelConfig = {
    'Dringend': 'bg-red-100 text-red-800 border-red-200',
    'Mittel': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Offen': 'bg-green-100 text-green-800 border-green-200',
  }

  // Status schnell ändern
  const handleStatusChange = async (newStatus: Task['status']) => {
    setIsUpdating(true)
    try {
      // Optimistische UI-Aktualisierung: Status sofort ändern
      const updatedTask = { ...task, status: newStatus }
      onUpdate(task.id, { status: newStatus })
      
      // Kurze Verzögerung für bessere UX (optional)
      await new Promise(resolve => setTimeout(resolve, 100))
    } finally {
      setIsUpdating(false)
    }
  }

  // Datum formatieren
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Unbekannt'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Ungültiges Datum'
    return dateObj.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Deadline formatieren
  const formatDeadline = (deadline: string | Date | null | undefined) => {
    if (!deadline) return { text: 'Keine Deadline', color: 'text-gray-400' }
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
    if (isNaN(deadlineDate.getTime())) return { text: 'Ungültige Deadline', color: 'text-gray-400' }
    
    const now = new Date()
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: 'Überfällig', color: 'text-red-600' }
    } else if (diffDays === 0) {
      return { text: 'Heute fällig', color: 'text-orange-600' }
    } else if (diffDays === 1) {
      return { text: 'Morgen fällig', color: 'text-yellow-600' }
    } else {
      return { text: `In ${diffDays} Tagen`, color: 'text-gray-600' }
    }
  }

  const StatusIcon = statusConfig[task.status as keyof typeof statusConfig].icon
  const deadlineInfo = task.deadline ? formatDeadline(task.deadline) : null

  return (
    <Card className={`hover:shadow-md transition-shadow ${task.status === 'erledigt' ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`text-lg mb-2 ${task.status === 'erledigt' ? 'line-through text-gray-500' : ''}`}>{task.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge className={statusConfig[task.status as keyof typeof statusConfig].color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[task.status as keyof typeof statusConfig].label}
              </Badge>
              {/* Zeige Label-Badge wenn verfügbar, sonst Prioritäts-Badge */}
              {task.label && labelConfig[task.label as keyof typeof labelConfig] ? (
                <Badge className={labelConfig[task.label as keyof typeof labelConfig]}>
                  {task.label}
                </Badge>
              ) : (
                <Badge className={priorityConfig[task.priority as keyof typeof priorityConfig]}>
                  {task.priority}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Beschreibung */}
        {task.description && (
          <p className={`text-gray-700 mb-4 ${task.status === 'erledigt' ? 'line-through text-gray-500' : ''}`}>{task.description}</p>
        )}

        {/* Kommentar */}
        {task.comment && (
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <p className={`text-sm text-gray-700 ${task.status === 'erledigt' ? 'line-through text-gray-500' : ''}`}>
              <strong>Kommentar:</strong> {task.comment}
            </p>
          </div>
        )}

        {/* Deadline */}
        {task.deadline && (
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Fällig: {formatDate(task.deadline)}
            </span>
            {deadlineInfo && (
              <span className={`text-sm font-medium ${deadlineInfo.color}`}>
                ({deadlineInfo.text})
              </span>
            )}
          </div>
        )}

        {/* Schnell-Aktionen für Status */}
        <div className="flex gap-2 mb-4">
          {task.status !== 'offen' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('offen')}
              disabled={isUpdating}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Offen
            </Button>
          )}
          {task.status !== 'in_bearbeitung' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('in_bearbeitung')}
              disabled={isUpdating}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <PlayCircle className="h-3 w-3 mr-1" />
              In Bearbeitung
            </Button>
          )}
          {task.status !== 'erledigt' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('erledigt')}
              disabled={isUpdating}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Erledigt
            </Button>
          )}
        </div>

        {/* Metadaten */}
        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Erstellt: {formatDate(task.created_at || task.createdAt)}
          </div>
          {(task.updated_at || task.updatedAt) !== (task.created_at || task.createdAt) && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Aktualisiert: {formatDate(task.updated_at || task.updatedAt)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

