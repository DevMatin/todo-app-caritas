/**
 * Database Debug Script für Supabase
 * 
 * Dieses Script testet die Datenbank-Verbindung und RLS-Policies
 * um herauszufinden, warum Updates nicht funktionieren.
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Teste Datenbank-Verbindung...');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    // Test 1: Verbindung testen
    console.log('\n📡 Test 1: Datenbank-Verbindung');
    await prisma.$connect();
    console.log('✅ Prisma Client erfolgreich verbunden');
    
    // Test 2: Datenbank-Info abrufen
    console.log('\n📡 Test 2: Datenbank-Informationen');
    const dbInfo = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Datenbank:', dbInfo[0].version);
    
    // Test 3: Tabellen-Struktur prüfen
    console.log('\n📡 Test 3: Tabellen-Struktur');
    const tables = await prisma.$queryRaw`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('📋 Verfügbare Tabellen:', tables);
    
    // Test 4: RLS-Status prüfen
    console.log('\n📡 Test 4: RLS-Status');
    const rlsStatus = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'tasks');
    `;
    console.log('🔒 RLS-Status:', rlsStatus);
    
    // Test 5: Policies prüfen
    console.log('\n📡 Test 5: Sicherheitsrichtlinien');
    const policies = await prisma.$queryRaw`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'tasks');
    `;
    console.log('🛡️ Sicherheitsrichtlinien:', policies);
    
    // Test 6: Test-User erstellen/finden
    console.log('\n📡 Test 6: Test-User');
    let testUser;
    try {
      testUser = await prisma.user.findUnique({
        where: { email: 'faal@caritas-erlangen.de' }
      });
      
      if (!testUser) {
        console.log('👤 Test-User nicht gefunden, erstelle neuen...');
        testUser = await prisma.user.create({
          data: {
            email: 'faal@caritas-erlangen.de',
            name: 'Matin Faal',
            password: 'webhook-user'
          }
        });
        console.log('✅ Test-User erstellt:', testUser.id);
      } else {
        console.log('✅ Test-User gefunden:', testUser.id);
      }
    } catch (userError) {
      console.log('❌ Fehler beim User-Test:', userError.message);
      console.log('💡 Mögliche Ursachen:');
      console.log('   - RLS blockiert User-Operationen');
      console.log('   - Fehlende Berechtigungen');
      console.log('   - Falsche DATABASE_URL');
    }
    
    // Test 7: Test-Task erstellen/aktualisieren
    if (testUser) {
      console.log('\n📡 Test 7: Test-Task');
      try {
        let testTask = await prisma.task.findFirst({
          where: {
            externalId: '1614531618771305515',
            userId: testUser.id
          }
        });
        
        if (!testTask) {
          console.log('📝 Test-Task nicht gefunden, erstelle neue...');
          testTask = await prisma.task.create({
            data: {
              title: 'Heizung Reparatur',
              description: 'Heizung Tropft',
              status: 'offen',
              priority: 'Priorität 2',
              label: 'mittel',
              deadline: new Date('2025-10-13T10:00:00.000Z'),
              externalId: '1614531618771305515',
              userId: testUser.id
            }
          });
          console.log('✅ Test-Task erstellt:', testTask.id);
        } else {
          console.log('✅ Test-Task gefunden:', testTask.id);
        }
        
        // Test 8: Task-Update testen
        console.log('\n📡 Test 8: Task-Update');
        const updatedTask = await prisma.task.update({
          where: { id: testTask.id },
          data: {
            priority: 'Priorität 1',
            status: 'in_bearbeitung',
            label: 'hoch'
          }
        });
        console.log('✅ Task erfolgreich aktualisiert:');
        console.log(`   Priorität: ${updatedTask.priority}`);
        console.log(`   Status: ${updatedTask.status}`);
        console.log(`   Label: ${updatedTask.label}`);
        
      } catch (taskError) {
        console.log('❌ Fehler beim Task-Test:', taskError.message);
        console.log('💡 Mögliche Ursachen:');
        console.log('   - RLS blockiert Task-Operationen');
        console.log('   - Fehlende Berechtigungen für Tasks-Tabelle');
        console.log('   - Falsche User-ID-Zuordnung');
      }
    }
    
    // Test 9: Alle Tasks des Users abrufen
    if (testUser) {
      console.log('\n📡 Test 9: Alle Tasks des Users');
      try {
        const userTasks = await prisma.task.findMany({
          where: { userId: testUser.id },
          orderBy: { updatedAt: 'desc' },
          take: 5
        });
        console.log(`✅ ${userTasks.length} Tasks gefunden:`);
        userTasks.forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.title} - ${task.priority} (${task.status})`);
        });
      } catch (tasksError) {
        console.log('❌ Fehler beim Abrufen der Tasks:', tasksError.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Datenbank-Fehler:', error.message);
    console.log('💡 Mögliche Ursachen:');
    console.log('   - Falsche DATABASE_URL');
    console.log('   - Supabase-Verbindung unterbrochen');
    console.log('   - Fehlende Umgebungsvariablen');
    console.log('   - RLS blockiert alle Operationen');
  } finally {
    await prisma.$disconnect();
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Überprüfe Umgebungsvariablen...');
  
  const requiredVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'INBOUND_WEBHOOK_TOKEN'
  ];
  
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: gesetzt`);
    } else {
      console.log(`❌ ${varName}: fehlt`);
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('\n⚠️ Fehlende Umgebungsvariablen:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n💡 Lösung:');
    console.log('   1. Erstelle eine .env.local Datei');
    console.log('   2. Kopiere die Werte aus env.example');
    console.log('   3. Setze die korrekten Supabase-Werte');
  }
}

async function runDatabaseDebug() {
  console.log('🚀 Starte Datenbank-Debug...');
  
  await checkEnvironmentVariables();
  await testDatabaseConnection();
  
  console.log('\n✨ Datenbank-Debug abgeschlossen!');
  console.log('\n📝 Nächste Schritte:');
  console.log('   1. Prüfe die Logs für spezifische Fehler');
  console.log('   2. Falls RLS aktiviert ist, deaktiviere es temporär');
  console.log('   3. Prüfe die Supabase-Konfiguration');
  console.log('   4. Teste die Webhook-Verbindung');
}

// Debug ausführen
runDatabaseDebug().catch(console.error);
