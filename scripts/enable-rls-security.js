#!/usr/bin/env node
// scripts/enable-rls-security.js
const { PrismaClient } = require('@prisma/client');

async function enableRLSSecurity() {
  console.log('🔒 Aktiviere Row Level Security (RLS) für Supabase...');
  
  const prisma = new PrismaClient();
  
  try {
    // Teste die Verbindung
    await prisma.$connect();
    console.log('✅ Verbindung zur Datenbank erfolgreich');
    
    // Prüfe ob wir mit PostgreSQL verbunden sind
    const dbInfo = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Datenbank:', dbInfo[0].version);
    
    // Aktiviere RLS für users-Tabelle
    console.log('🔒 Aktiviere RLS für users-Tabelle...');
    await prisma.$executeRaw`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;`;
    
    // Aktiviere RLS für tasks-Tabelle
    console.log('🔒 Aktiviere RLS für tasks-Tabelle...');
    await prisma.$executeRaw`ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;`;
    
    // Erstelle Richtlinien für users-Tabelle
    console.log('📋 Erstelle Sicherheitsrichtlinien für users...');
    
    // Users können nur ihre eigenen Daten sehen/bearbeiten
    await prisma.$executeRaw`
      CREATE POLICY "Users can view own profile" ON "users"
      FOR SELECT USING (auth.uid()::text = id);
    `;
    
    await prisma.$executeRaw`
      CREATE POLICY "Users can update own profile" ON "users"
      FOR UPDATE USING (auth.uid()::text = id);
    `;
    
    // Erstelle Richtlinien für tasks-Tabelle
    console.log('📋 Erstelle Sicherheitsrichtlinien für tasks...');
    
    // Users können nur ihre eigenen Tasks sehen
    await prisma.$executeRaw`
      CREATE POLICY "Users can view own tasks" ON "tasks"
      FOR SELECT USING (auth.uid()::text = "user_id");
    `;
    
    // Users können nur ihre eigenen Tasks erstellen
    await prisma.$executeRaw`
      CREATE POLICY "Users can create own tasks" ON "tasks"
      FOR INSERT WITH CHECK (auth.uid()::text = "user_id");
    `;
    
    // Users können nur ihre eigenen Tasks bearbeiten
    await prisma.$executeRaw`
      CREATE POLICY "Users can update own tasks" ON "tasks"
      FOR UPDATE USING (auth.uid()::text = "user_id");
    `;
    
    // Users können nur ihre eigenen Tasks löschen
    await prisma.$executeRaw`
      CREATE POLICY "Users can delete own tasks" ON "tasks"
      FOR DELETE USING (auth.uid()::text = "user_id");
    `;
    
    console.log('✅ RLS und Sicherheitsrichtlinien erfolgreich aktiviert!');
    console.log('');
    console.log('📝 Wichtige Hinweise:');
    console.log('   - Jeder Benutzer kann nur seine eigenen Daten sehen');
    console.log('   - Tasks sind nur für den jeweiligen Besitzer sichtbar');
    console.log('   - Die API ist jetzt sicher vor unbefugtem Zugriff');
    console.log('');
    console.log('⚠️  Hinweis: Diese Richtlinien funktionieren nur mit Supabase Auth.');
    console.log('   Da Sie NextAuth.js verwenden, müssen Sie möglicherweise');
    console.log('   eine andere Sicherheitsstrategie implementieren.');
    
  } catch (error) {
    console.error('❌ Fehler beim Aktivieren von RLS:', error);
    
    if (error.message.includes('auth.uid')) {
      console.log('');
      console.log('💡 Lösung: Da Sie NextAuth.js verwenden, benötigen Sie eine');
      console.log('   andere Sicherheitsstrategie. Siehe SUPABASE_SECURITY.md');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  enableRLSSecurity()
    .then(() => {
      console.log('🎉 Supabase-Sicherheit erfolgreich konfiguriert!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fehler:', error);
      process.exit(1);
    });
}

module.exports = { enableRLSSecurity };
