'use client'

// NextAuth SessionProvider entfernt - Supabase Auth wird direkt in den Komponenten verwendet
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

