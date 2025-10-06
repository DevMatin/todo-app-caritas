'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Prüfen ob eine Nachricht von der Registrierung vorhanden ist
    const message = searchParams.get('message')
    if (message) {
      setMessage(message)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log('Login-Fehler:', error.message)
        if (error.message.includes('Invalid login credentials')) {
          setError('Ungültige E-Mail oder Passwort')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Bitte bestätigen Sie Ihre E-Mail-Adresse')
        } else {
          setError(error.message)
        }
      } else {
        console.log('Login erfolgreich:', data.user?.email)
        // Weiterleitung zur Hauptseite
        router.push('/')
      }
    } catch (error: any) {
      console.error('Login-Fehler:', error)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Todo App Caritas</CardTitle>
          <CardDescription>
            Melden Sie sich an, um Ihre Aufgaben zu verwalten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ihre@email.de"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ihr Passwort"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            {message && (
              <div className="text-green-600 text-sm text-center">
                {message}
              </div>
            )}
            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: '#d21c1a' }}
              disabled={isLoading}
            >
              {isLoading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Noch kein Konto?{' '}
              <a
                href="/register"
                className="font-medium"
                style={{ color: '#d21c1a' }}
              >
                Hier registrieren
              </a>
            </p>
            <p className="text-sm text-gray-600">
              Passwort vergessen?{' '}
              <a
                href="/forgot-password"
                className="font-medium"
                style={{ color: '#d21c1a' }}
              >
                Zurücksetzen
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
