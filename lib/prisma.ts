import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma Client für Supabase optimiert
function createPrismaClient() {
  // Optimiere DATABASE_URL für Supabase
  let databaseUrl = process.env.DATABASE_URL
  
  // Füge Connection Pooling Parameter hinzu für Supabase
  if (databaseUrl && !databaseUrl.includes('pgbouncer')) {
    // Verwende Supabase Connection Pooling
    databaseUrl = databaseUrl.replace('postgresql://', 'postgresql://') + '?pgbouncer=true&connection_limit=1'
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Verhindere prepared statement Konflikte in Development
    ...(process.env.NODE_ENV === 'development' && {
      errorFormat: 'pretty',
    }),
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
