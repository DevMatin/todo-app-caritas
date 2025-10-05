'use client'

import { useSession } from 'next-auth/react'

export default function TestSessionPage() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Session Test</h1>
        <div className="space-y-2">
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Session vorhanden:</strong> {session ? 'Ja' : 'Nein'}</p>
          {session && (
            <>
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>Name:</strong> {session.user?.name}</p>
              <p><strong>ID:</strong> {session.user?.id}</p>
            </>
          )}
        </div>
        <div className="mt-4">
          <a href="/login" className="text-blue-600 hover:underline">Zur Login-Seite</a>
        </div>
      </div>
    </div>
  )
}
