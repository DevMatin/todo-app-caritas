'use client'

import { createClient } from '@/lib/supabase-client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

// Force dynamic rendering to avoid static generation issues with cookies
export const dynamic = 'force-dynamic'

export default function TestMiddlewarePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      console.log('🔍 Test-Seite: User Data:', user)
    }
    
    getUser()
  }, [supabase.auth])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
        <h1 className="text-2xl font-bold mb-4">Middleware Test (Supabase Auth)</h1>
        <div className="space-y-2">
          <p><strong>Status:</strong> {loading ? 'Laden...' : 'Geladen'}</p>
          <p><strong>User vorhanden:</strong> {user ? 'Ja' : 'Nein'}</p>
          {user && (
            <>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.user_metadata?.name || 'Nicht gesetzt'}</p>
              <p><strong>ID:</strong> {user.id}</p>
            </>
          )}
        </div>
        <div className="mt-4 space-y-2">
          <a href="/" className="block text-blue-600 hover:underline">Zur Hauptseite</a>
          <a href="/login" className="block text-blue-600 hover:underline">Zur Login-Seite</a>
        </div>
      </div>
    </div>
  )
}
