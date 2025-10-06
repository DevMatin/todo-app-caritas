const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Lade .env.local manuell
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        process.env[key.trim()] = value.trim()
      }
    })
  }
}

loadEnvFile()

async function debugSupabasePriority() {
  console.log('🔍 Debug: Prioritäts-Update Problem')
  
  // Verwende die korrekten Umgebungsvariablen
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('🔑 Supabase URL:', supabaseUrl)
  console.log('🔑 Service Key vorhanden:', supabaseKey ? 'Ja' : 'Nein')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase-Konfiguration fehlt!')
    console.error('   Bitte setzen Sie NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in .env.local')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Teste die Verbindung
    console.log('\n🔌 Teste Supabase-Verbindung...')
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Verbindungstest fehlgeschlagen:', testError)
      return
    }
    
    console.log('✅ Supabase-Verbindung erfolgreich!')
    
    // Alle Tasks abrufen
    console.log('\n📊 Lade alle Tasks...')
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ Fehler beim Abrufen der Tasks:', error)
      return
    }
    
    console.log(`📋 Gefundene Tasks: ${tasks.length}`)
    
    tasks.forEach((task, index) => {
      console.log(`\n📝 Task ${index + 1}:`)
      console.log(`   ID: ${task.id}`)
      console.log(`   Titel: ${task.title}`)
      console.log(`   Priorität: ${task.priority}`)
      console.log(`   Status: ${task.status}`)
      console.log(`   Label: ${task.label}`)
      console.log(`   External ID: ${task.external_id}`)
      console.log(`   Aktualisiert: ${task.updated_at}`)
    })
    
    // Teste ein Prioritäts-Update
    if (tasks.length > 0) {
      const testTask = tasks[0]
      console.log(`\n🧪 Teste Prioritäts-Update für Task: ${testTask.id}`)
      
      const newPriority = testTask.priority === 'Priorität 1' ? 'Priorität 2' : 'Priorität 1'
      
      const { data: updateResult, error: updateError } = await supabase
        .from('tasks')
        .update({ 
          priority: newPriority,
          updated_at: new Date().toISOString()
        })
        .eq('id', testTask.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Update-Test fehlgeschlagen:', updateError)
      } else {
        console.log('✅ Update-Test erfolgreich!')
        console.log(`   Alte Priorität: ${testTask.priority}`)
        console.log(`   Neue Priorität: ${updateResult.priority}`)
        
        // Zurück ändern
        await supabase
          .from('tasks')
          .update({ 
            priority: testTask.priority,
            updated_at: new Date().toISOString()
          })
          .eq('id', testTask.id)
        
        console.log('🔄 Priorität zurückgesetzt')
      }
    }
    
  } catch (error) {
    console.error('❌ Allgemeiner Fehler:', error)
  }
}

debugSupabasePriority()
