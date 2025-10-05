import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort sind erforderlich' },
        { status: 400 }
      )
    }

    // Prüfen ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Benutzer mit dieser E-Mail existiert bereits' },
        { status: 400 }
      )
    }

    // Passwort hashen
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10')
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // User erstellen
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    return NextResponse.json(
      { message: 'Benutzer erfolgreich erstellt', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registrierungsfehler:', error)
    console.error('Fehler-Details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code || 'unknown',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen des Benutzers',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
