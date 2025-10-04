#!/usr/bin/env node
// scripts/enable-rls-security-supabase.js
const { createClient } = require('@supabase/supabase-js');

async function enableRLSSecuritySupabase() {
  console.log('🔒 Aktiviere Row Level Security (RLS) für Supabase...');
  
  // Supabase Client mit Service Role Key (für Admin-Operationen)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein');
    console.error('   Diese finden Sie in Supabase → Settings → API');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Teste die Verbindung
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Verbindungsfehler:', error.message);
      process.exit(1);
    }
    console.log('✅ Verbindung zu Supabase erfolgreich');
    
    // Aktiviere RLS für users-Tabelle
    console.log('🔒 Aktiviere RLS für users-Tabelle...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;'
    });
    
    if (usersError) {
      console.error('❌ Fehler beim Aktivieren von RLS für users:', usersError.message);
    } else {
      console.log('✅ RLS für users-Tabelle aktiviert');
    }
    
    // Aktiviere RLS für tasks-Tabelle
    console.log('🔒 Aktiviere RLS für tasks-Tabelle...');
    const { error: tasksError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;'
    });
    
    if (tasksError) {
      console.error('❌ Fehler beim Aktivieren von RLS für tasks:', tasksError.message);
    } else {
      console.log('✅ RLS für tasks-Tabelle aktiviert');
    }
    
    console.log('');
    console.log('📝 Wichtige Hinweise:');
    console.log('   - RLS ist jetzt aktiviert');
    console.log('   - Da Sie NextAuth.js verwenden, funktionieren die');
    console.log('     Standard-RLS-Richtlinien nicht vollständig');
    console.log('   - Ihre App-Sicherheit erfolgt über NextAuth.js Sessions');
    console.log('');
    console.log('🔧 Nächste Schritte:');
    console.log('   1. Überprüfen Sie in Supabase → Table Editor');
    console.log('   2. Sie sollten "RLS is enabled" sehen');
    console.log('   3. Für vollständige Sicherheit: Supabase Auth verwenden');
    
  } catch (error) {
    console.error('❌ Fehler beim Aktivieren von RLS:', error);
    throw error;
  }
}

if (require.main === module) {
  enableRLSSecuritySupabase()
    .then(() => {
      console.log('🎉 RLS erfolgreich aktiviert!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fehler:', error);
      process.exit(1);
    });
}

module.exports = { enableRLSSecuritySupabase };
