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
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: any) {
      if (token && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})

export { handler as GET, handler as POST }
