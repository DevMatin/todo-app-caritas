import { PrismaClient } from '@prisma/client'

// Funktion um Prisma Client zu erstellen - verhindert prepared statement Fehler
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// In Vercel/Serverless: Erstelle bei jedem Import einen neuen Client
// Das verhindert "prepared statement already exists" Fehler komplett
export const prisma = createPrismaClient()
