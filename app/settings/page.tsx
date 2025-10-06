'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, User, Lock, Mail } from 'lucide-react'

// Force dynamic rendering to avoid static generation issues with cookies
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  })
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      setProfileData({
        name: user.user_metadata?.name || '',
        email: user.email || ''
      })
      setLoading(false)
    }
    
    getUser()
  }, [router, supabase.auth])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: profileData.name }
      })

      if (error) throw error

      setMessage('Profil erfolgreich aktualisiert')
    } catch (error: any) {
      setError(error.message || 'Fehler beim Aktualisieren des Profils')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError('')
    setMessage('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein')
      setIsUpdating(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen lang sein')
      setIsUpdating(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setMessage('Passwort erfolgreich geändert')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      setError(error.message || 'Fehler beim Ändern des Passworts')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Konto-Einstellungen</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie Ihre Kontoinformationen und Sicherheitseinstellungen</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="h-4 w-4 mr-2" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock className="h-4 w-4 mr-2" />
            Passwort
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profil bearbeiten
              </CardTitle>
              <CardDescription>
                Aktualisieren Sie Ihre persönlichen Informationen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ihr Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <p className="text-sm text-gray-500">E-Mail-Adresse kann nicht geändert werden</p>
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                {message && (
                  <div className="text-green-600 text-sm">
                    {message}
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full text-white"
                  style={{ backgroundColor: '#d21c1a' }}
                >
                  {isUpdating ? 'Speichern...' : 'Profil aktualisieren'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Passwort ändern
              </CardTitle>
              <CardDescription>
                Ändern Sie Ihr Passwort für mehr Sicherheit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    placeholder="Aktuelles Passwort"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    placeholder="Mindestens 6 Zeichen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    placeholder="Passwort wiederholen"
                  />
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                {message && (
                  <div className="text-green-600 text-sm">
                    {message}
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full text-white"
                  style={{ backgroundColor: '#d21c1a' }}
                >
                  {isUpdating ? 'Ändern...' : 'Passwort ändern'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Forgot Password Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Passwort vergessen?{' '}
            <button
              onClick={() => router.push('/forgot-password')}
              className="font-medium text-red-600 hover:text-red-500"
            >
              Zurücksetzen
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
