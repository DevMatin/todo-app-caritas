import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// In Vercel/Serverless-Umgebungen wird der Client bei jedem Request neu erstellt
// Das verhindert "prepared statement already exists" Fehler
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
