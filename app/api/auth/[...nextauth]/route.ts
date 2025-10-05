import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'

// @ts-ignore - NextAuth v4 compatibility issue
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('NextAuth: Fehlende Anmeldedaten')
            return null
          }

          console.log(`NextAuth: Versuche Login für ${credentials.email}`)
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.log(`NextAuth: User nicht gefunden für ${credentials.email}`)
            return null
          }

          const valid = await bcrypt.compare(credentials.password, user.password)
          if (!valid) {
            console.log(`NextAuth: Ungültiges Passwort für ${credentials.email}`)
            return null
          }

          console.log(`NextAuth: Erfolgreicher Login für ${credentials.email}`)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error('NextAuth: Fehler beim Login:', error)
          console.error('NextAuth: Fehler-Details:', {
            message: error instanceof Error ? error.message : String(error),
            code: (error as any)?.code || 'unknown',
            stack: error instanceof Error ? error.stack : undefined
          })
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
    updateAge: 24 * 60 * 60, // 24 Stunden
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      console.log('NextAuth JWT Callback:', { token: !!token, user: !!user })
      if (user) {
        token.id = user.id
        console.log('NextAuth: User-Daten in Token gesetzt:', { id: user.id, email: user.email })
      }
      return token
    },
    async session({ session, token }: any) {
      console.log('NextAuth Session Callback:', { session: !!session, token: !!token })
      if (token && token.id) {
        session.user.id = token.id as string
        console.log('NextAuth: Session mit User-ID erstellt:', session.user.id)
      }
      return session
    },
    async redirect({ url, baseUrl }: any) {
      console.log('NextAuth Redirect Callback:', { url, baseUrl })
      // Wenn die URL relativ ist, zur Basis-URL weiterleiten
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Wenn die URL die gleiche Domain hat, dorthin weiterleiten
      else if (new URL(url).origin === baseUrl) return url
      // Ansonsten zur Basis-URL weiterleiten
      return baseUrl
    },
  },
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
