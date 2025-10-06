import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma Client für lokale Entwicklung mit SQLite
function createPrismaClient() {
  console.log('Prisma: NODE_ENV:', process.env.NODE_ENV)
  
  // Für lokale Entwicklung: SQLite verwenden
  if (process.env.NODE_ENV === 'development') {
    console.log('Prisma: Verwende SQLite für lokale Entwicklung')
    return new PrismaClient({
      log: ['error', 'warn', 'query'],
      errorFormat: 'pretty',
    })
  }
  
  // Für Produktion: PostgreSQL/Supabase verwenden
  const databaseUrl = process.env.DATABASE_URL
  console.log('Prisma: DATABASE_URL vorhanden:', !!databaseUrl)
  
  if (!databaseUrl) {
    console.error('Prisma: DATABASE_URL ist nicht gesetzt!')
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  // Füge Connection Pooling Parameter hinzu für Supabase
  let optimizedUrl = databaseUrl
  if (databaseUrl && !databaseUrl.includes('pgbouncer')) {
    // Verwende Supabase Connection Pooling
    optimizedUrl = databaseUrl.replace('postgresql://', 'postgresql://') + '?pgbouncer=true&connection_limit=1'
  }

  return new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: optimizedUrl,
      },
    },
  })
}

// Use existing instance or create new one
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// In development, store the instance globally to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Export a function to get a fresh Prisma client instance
export function getPrismaClient() {
  if (process.env.NODE_ENV === 'development') {
    // In development, always create a new instance to avoid prepared statement conflicts
    // Disconnect existing instance first
    if (globalForPrisma.prisma) {
      try {
        globalForPrisma.prisma.$disconnect()
      } catch (error) {
        // Ignore disconnect errors
      }
      globalForPrisma.prisma = undefined
    }
    return createPrismaClient()
  }
  return prisma
}

// Cleanup function für Development Hot Reload
if (process.env.NODE_ENV === 'development') {
  // Cleanup bei Hot Reload
  if (typeof window === 'undefined') {
    // Cleanup existing connections before creating new ones
    const cleanup = async () => {
      if (globalForPrisma.prisma) {
        try {
          await globalForPrisma.prisma.$disconnect()
        } catch (error) {
          console.log('Prisma cleanup error (ignored):', error)
        }
        globalForPrisma.prisma = undefined
      }
    }
    
    // Cleanup on process signals
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    
    // Cleanup on uncaught exceptions
    process.on('uncaughtException', cleanup)
    process.on('unhandledRejection', cleanup)
  }
}

// Handle connection cleanup
export async function disconnectPrisma() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect()
    globalForPrisma.prisma = undefined
  }
}

// Graceful shutdown handler für Development
if (process.env.NODE_ENV === 'development') {
  // Cleanup bei Hot Reload
  if (typeof window === 'undefined') {
    process.on('SIGINT', async () => {
      await disconnectPrisma()
      process.exit(0)
    })
    
    process.on('SIGTERM', async () => {
      await disconnectPrisma()
      process.exit(0)
    })
  }
}
