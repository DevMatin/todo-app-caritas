const { createClient } = require('@supabase/supabase-js')

async function debugSupabase() {
  console.log('🔍 Debug: Direkte Supabase-Abfrage')
  
  // Verwende die echten Umgebungsvariablen aus .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qjqjqjqjqjqjqj.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
  
  console.log('🔑 Supabase URL:', supabaseUrl)
  console.log('🔑 Service Key vorhanden:', supabaseKey ? 'Ja' : 'Nein')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Alle Tasks für den User abrufen
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', '878b6d6d-d8d3-4d1e-bdba-fd9bb4b605de') // Die User-ID aus dem Webhook
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('❌ Fehler beim Abrufen der Tasks:', error)
      return
    }
    
    console.log(`📊 Gefundene Tasks: ${tasks.length}`)
    
    tasks.forEach((task, index) => {
      console.log(`\n📝 Task ${index + 1}:`)
      console.log(`   ID: ${task.id}`)
      console.log(`   Titel: ${task.title}`)
      console.log(`   Priorität: ${task.priority}`)
      console.log(`   Status: ${task.status}`)
      console.log(`   Label: ${task.label}`)
      console.log(`   External ID: ${task.external_id}`)
      console.log(`   Erstellt: ${task.created_at}`)
      console.log(`   Aktualisiert: ${task.updated_at}`)
    })
    
    // Spezifische Task mit external_id suchen
    const { data: specificTask, error: specificError } = await supabase
      .from('tasks')
      .select('*')
      .eq('external_id', '1614531618771305515')
      .single()
    
    if (specificError) {
      console.error('❌ Fehler beim Abrufen der spezifischen Task:', specificError)
    } else if (specificTask) {
      console.log('\n🎯 Spezifische Task (external_id: 1614531618771305515):')
      console.log(`   ID: ${specificTask.id}`)
      console.log(`   Titel: ${specificTask.title}`)
      console.log(`   Priorität: ${specificTask.priority}`)
      console.log(`   Status: ${specificTask.status}`)
      console.log(`   Label: ${specificTask.label}`)
      console.log(`   Aktualisiert: ${specificTask.updated_at}`)
    } else {
      console.log('\n❌ Keine Task mit external_id 1614531618771305515 gefunden')
    }
    
  } catch (error) {
    console.error('❌ Allgemeiner Fehler:', error)
  }
}

debugSupabase()
