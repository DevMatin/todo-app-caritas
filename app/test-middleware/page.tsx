'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function TestMiddlewarePage() {
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log('🔍 Test-Seite: Session Status:', status)
    console.log('🔍 Test-Seite: Session Data:', session)
  }, [session, status])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
        <h1 className="text-2xl font-bold mb-4">Middleware Test</h1>
        <div className="space-y-2">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Session vorhanden:</strong> {session ? 'Ja' : 'Nein'}</p>
          {session && (
            <>
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>Name:</strong> {session.user?.name}</p>
              <p><strong>ID:</strong> {(session.user as any)?.id}</p>
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
