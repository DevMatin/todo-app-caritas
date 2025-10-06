import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Test-Route für Datenbankverbindung
export async function GET(request: NextRequest) {
  try {
    console.log('DB-Test: Starte Datenbanktest...')
    
    // Prüfe Umgebungsvariablen
    console.log('DB-Test: DATABASE_URL vorhanden:', !!process.env.DATABASE_URL)
    console.log('DB-Test: NODE_ENV:', process.env.NODE_ENV)
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'DATABASE_URL nicht gesetzt',
        env: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL: 'NOT_SET'
        }
      }, { status: 500 })
    }
    
    // Teste Datenbankverbindung
    console.log('DB-Test: Teste Datenbankverbindung...')
    const userCount = await prisma.user.count()
    
    console.log('DB-Test: Datenbankverbindung erfolgreich')
    console.log('DB-Test: User-Anzahl:', userCount)
    
    return NextResponse.json({
      success: true,
      message: 'Datenbankverbindung erfolgreich',
      userCount,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
      }
    })
    
  } catch (error) {
    console.error('DB-Test: Fehler:', error)
    console.error('DB-Test: Fehler-Details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    return NextResponse.json({
      error: 'Datenbankverbindung fehlgeschlagen',
      details: error instanceof Error ? error.message : String(error),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
      }
    }, { status: 500 })
  }
}
