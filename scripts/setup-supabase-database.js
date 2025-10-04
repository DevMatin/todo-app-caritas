#!/usr/bin/env node
// scripts/setup-supabase-database.js
const { PrismaClient } = require('@prisma/client');

async function setupSupabaseDatabase() {
  console.log('🚀 Richte Supabase-Datenbankstruktur ein...');
  
  const prisma = new PrismaClient();
  
  try {
    // Teste die Verbindung
    await prisma.$connect();
    console.log('✅ Verbindung zur Datenbank erfolgreich');
    
    // Prüfe ob Tabellen existieren
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('📋 Vorhandene Tabellen:', tables.map(t => t.table_name));
    
    if (tables.length === 0) {
      console.log('⚠️  Keine Tabellen gefunden. Führe Migrationen aus...');
      
      // Führe die Migrationen manuell aus
      console.log('📝 Erstelle users-Tabelle...');
      await prisma.$executeRaw`
        CREATE TABLE "users" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL
        );
      `;
      
      console.log('📝 Erstelle tasks-Tabelle...');
      await prisma.$executeRaw`
        CREATE TABLE "tasks" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "priority" TEXT NOT NULL DEFAULT 'mittel',
          "status" TEXT NOT NULL DEFAULT 'offen',
          "deadline" TIMESTAMP(3),
          "comment" TEXT,
          "external_id" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          "user_id" TEXT NOT NULL,
          CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `;
      
      console.log('📝 Erstelle Index für users.email...');
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
      `;
      
      console.log('✅ Datenbankstruktur erfolgreich erstellt!');
    } else {
      console.log('✅ Tabellen bereits vorhanden');
    }
    
    // Teste die Tabellen
    const userCount = await prisma.user.count();
    const taskCount = await prisma.task.count();
    
    console.log(`📊 Aktuelle Daten:`);
    console.log(`   - Benutzer: ${userCount}`);
    console.log(`   - Aufgaben: ${taskCount}`);
    
  } catch (error) {
    console.error('❌ Fehler beim Einrichten der Datenbank:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupSupabaseDatabase()
    .then(() => {
      console.log('🎉 Supabase-Datenbank erfolgreich eingerichtet!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fehler:', error);
      process.exit(1);
    });
}

module.exports = { setupSupabaseDatabase };
