// Direkter Supabase-Test ohne dotenv
const { createClient } = require('@supabase/supabase-js')

async function testSupabaseDirect() {
  console.log('🔍 Direkter Supabase-Test')
  
  // Verwende die echten Werte (ersetze mit Ihren echten Werten)
  const supabaseUrl = 'https://qjqjqjqjqjqjqjqj.supabase.co'  // Ihre echte Supabase URL
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcWpxanFqcWpxanFqcWoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM4NzY3NDAwLCJleHAiOjE3NDAzNTM0MDB9.example'  // Ihr echter Service Role Key
  
  console.log('🔑 Supabase URL:', supabaseUrl)
  console.log('🔑 Service Key vorhanden:', supabaseKey ? 'Ja' : 'Nein')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test 1: Alle Tasks abrufen
    console.log('\n📊 Test 1: Alle Tasks abrufen')
    const { data: allTasks, error: allError } = await supabase
      .from('tasks')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5)
    
    if (allError) {
      console.error('❌ Fehler beim Abrufen aller Tasks:', allError)
    } else {
      console.log(`✅ Gefundene Tasks: ${allTasks.length}`)
      allTasks.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.title} - Priorität: ${task.priority} - Status: ${task.status}`)
      })
    }
    
    // Test 2: Spezifische Task mit external_id suchen
    console.log('\n🎯 Test 2: Task mit external_id 1614531618771305515')
    const { data: specificTask, error: specificError } = await supabase
      .from('tasks')
      .select('*')
      .eq('external_id', '1614531618771305515')
      .single()
    
    if (specificError) {
      console.error('❌ Fehler beim Abrufen der spezifischen Task:', specificError)
    } else if (specificTask) {
      console.log('✅ Spezifische Task gefunden:')
      console.log(`   ID: ${specificTask.id}`)
      console.log(`   Titel: ${specificTask.title}`)
      console.log(`   Priorität: ${specificTask.priority}`)
      console.log(`   Status: ${specificTask.status}`)
      console.log(`   Label: ${specificTask.label}`)
      console.log(`   External ID: ${specificTask.external_id}`)
      console.log(`   Aktualisiert: ${specificTask.updated_at}`)
    } else {
      console.log('❌ Keine Task mit external_id 1614531618771305515 gefunden')
    }
    
    // Test 3: Direkter Update-Test
    if (specificTask) {
      console.log('\n🔄 Test 3: Direkter Update-Test')
      const { data: updateResult, error: updateError } = await supabase
        .from('tasks')
        .update({ 
          priority: 'Priorität 2 - DIREKT TEST',
          updated_at: new Date().toISOString()
        })
        .eq('id', specificTask.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Fehler beim direkten Update:', updateError)
      } else {
        console.log('✅ Direkter Update erfolgreich:')
        console.log(`   Neue Priorität: ${updateResult.priority}`)
        console.log(`   Aktualisiert: ${updateResult.updated_at}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Allgemeiner Fehler:', error)
  }
}

testSupabaseDirect()
