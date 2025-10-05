/**
 * RLS Management Script für Supabase
 * 
 * Dieses Script hilft beim Debuggen von RLS-Problemen
 * durch temporäres Deaktivieren/Aktivieren von RLS.
 */

const { PrismaClient } = require('@prisma/client');

async function checkRLSStatus() {
  console.log('🔍 Überprüfe RLS-Status...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    const rlsStatus = await prisma.$queryRaw`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'tasks');
    `;
    
    console.log('🔒 Aktueller RLS-Status:');
    rlsStatus.forEach(table => {
      const status = table.rowsecurity ? '✅ AKTIV' : '❌ INAKTIV';
      console.log(`   ${table.tablename}: ${status}`);
    });
    
    return rlsStatus;
    
  } catch (error) {
    console.log('❌ Fehler beim Überprüfen des RLS-Status:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function disableRLS() {
  console.log('🔓 Deaktiviere RLS temporär...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // RLS für users deaktivieren
    console.log('🔓 Deaktiviere RLS für users-Tabelle...');
    await prisma.$executeRaw`ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;`;
    console.log('✅ RLS für users deaktiviert');
    
    // RLS für tasks deaktivieren
    console.log('🔓 Deaktiviere RLS für tasks-Tabelle...');
    await prisma.$executeRaw`ALTER TABLE "tasks" DISABLE ROW LEVEL SECURITY;`;
    console.log('✅ RLS für tasks deaktiviert');
    
    console.log('\n⚠️ WICHTIG: RLS ist jetzt deaktiviert!');
    console.log('   - Alle Daten sind öffentlich zugänglich');
    console.log('   - Nur für Debugging verwenden');
    console.log('   - Nach dem Test wieder aktivieren');
    
  } catch (error) {
    console.log('❌ Fehler beim Deaktivieren von RLS:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function enableRLS() {
  console.log('🔒 Aktiviere RLS wieder...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // RLS für users aktivieren
    console.log('🔒 Aktiviere RLS für users-Tabelle...');
    await prisma.$executeRaw`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;`;
    console.log('✅ RLS für users aktiviert');
    
    // RLS für tasks aktivieren
    console.log('🔒 Aktiviere RLS für tasks-Tabelle...');
    await prisma.$executeRaw`ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;`;
    console.log('✅ RLS für tasks aktiviert');
    
    console.log('\n✅ RLS ist wieder aktiviert');
    
  } catch (error) {
    console.log('❌ Fehler beim Aktivieren von RLS:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function createBasicPolicies() {
  console.log('🛡️ Erstelle grundlegende RLS-Policies...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Lösche bestehende Policies
    console.log('🗑️ Lösche bestehende Policies...');
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can view own profile" ON "users";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can update own profile" ON "users";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can view own tasks" ON "tasks";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can create own tasks" ON "tasks";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can update own tasks" ON "tasks";`;
    await prisma.$executeRaw`DROP POLICY IF EXISTS "Users can delete own tasks" ON "tasks";`;
    
    // Erstelle neue Policies (ohne auth.uid() für NextAuth.js)
    console.log('🛡️ Erstelle neue Policies...');
    
    // Users: Erlaube alle Operationen (für Webhook-User)
    await prisma.$executeRaw`
      CREATE POLICY "Allow all users operations" ON "users"
      FOR ALL USING (true);
    `;
    
    // Tasks: Erlaube alle Operationen (für Webhook-User)
    await prisma.$executeRaw`
      CREATE POLICY "Allow all tasks operations" ON "tasks"
      FOR ALL USING (true);
    `;
    
    console.log('✅ Grundlegende Policies erstellt');
    console.log('\n⚠️ HINWEIS: Diese Policies erlauben alle Operationen!');
    console.log('   - Nur für Debugging verwenden');
    console.log('   - In Produktion durch spezifische Policies ersetzen');
    
  } catch (error) {
    console.log('❌ Fehler beim Erstellen der Policies:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function testWebhookAfterRLSChange() {
  console.log('\n🧪 Teste Webhook nach RLS-Änderung...');
  
  const fetch = require('node-fetch');
  
  const testPayload = {
    "event": "actionCreate",
    "data": {
      "item": {
        "type": "moveCard",
        "data": {
          "card": { "name": "Test Task" },
          "toList": { "id": "test-list", "name": "Priorität 1" },
          "fromList": { "id": "test-list-2", "name": "Priorität 2" }
        },
        "boardId": "test-board",
        "cardId": "test-card-123"
      },
      "included": {
        "lists": [{ "id": "test-list", "name": "Priorität 1" }]
      }
    },
    "user": {
      "email": "faal@caritas-erlangen.de",
      "name": "Matin Faal"
    }
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': 'caritas-webhook-token-2024'
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook erfolgreich nach RLS-Änderung!');
      console.log('📋 Antwort:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Webhook immer noch fehlgeschlagen:', response.status);
      console.log('📋 Fehler:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Fehler beim Webhook-Test:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  console.log('🔧 RLS Management Tool für Supabase');
  
  switch (command) {
    case 'status':
      await checkRLSStatus();
      break;
      
    case 'disable':
      await disableRLS();
      await checkRLSStatus();
      break;
      
    case 'enable':
      await enableRLS();
      await checkRLSStatus();
      break;
      
    case 'policies':
      await createBasicPolicies();
      break;
      
    case 'test':
      await testWebhookAfterRLSChange();
      break;
      
    case 'debug':
      console.log('🔍 Vollständiger Debug-Modus...');
      await checkRLSStatus();
      console.log('\n🔓 Deaktiviere RLS temporär...');
      await disableRLS();
      console.log('\n🧪 Teste Webhook...');
      await testWebhookAfterRLSChange();
      console.log('\n🔒 Aktiviere RLS wieder...');
      await enableRLS();
      break;
      
    default:
      console.log('📖 Verwendung:');
      console.log('   node debug-rls.js status     - RLS-Status anzeigen');
      console.log('   node debug-rls.js disable    - RLS deaktivieren');
      console.log('   node debug-rls.js enable     - RLS aktivieren');
      console.log('   node debug-rls.js policies   - Grundlegende Policies erstellen');
      console.log('   node debug-rls.js test       - Webhook testen');
      console.log('   node debug-rls.js debug      - Vollständiger Debug-Modus');
      break;
  }
}

main().catch(console.error);
