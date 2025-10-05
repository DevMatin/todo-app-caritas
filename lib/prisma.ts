import { PrismaClient } from '@prisma/client'

// Radikale Lösung für Vercel: Deaktiviere Prepared Statements komplett
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Deaktiviere Prepared Statements für Vercel
    __internal: {
      engine: {
        preparedStatements: false,
      },
    },
  })
}

// Erstelle bei jedem Request einen komplett neuen Client
export const prisma = createPrismaClient()
