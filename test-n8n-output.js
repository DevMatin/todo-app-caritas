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

async function testN8nOutput() {
  console.log('🧪 Test: n8n Output (Priorität 2)')
  
  const webhookToken = process.env.INBOUND_WEBHOOK_TOKEN
  const webhookUrl = 'http://localhost:3000/api/webhooks/n8n'
  
  if (!webhookToken) {
    console.error('❌ INBOUND_WEBHOOK_TOKEN fehlt')
    return
  }
  
  // Simuliere die Daten aus Ihrem n8n Output
  const n8nData = {
    event: 'cardUpdate',
    data: {
      item: {
        id: '1614531618771305515',
        name: 'Heizung Reparatur',
        description: 'Heizung Tropft',
        dueDate: '2025-10-13T10:00:00.000Z',
        listId: 'list-prio2'
      },
      included: {
        lists: [{ id: 'list-prio2', name: 'Priorität 2' }]
      }
    },
    user: { 
      email: 'faal@caritas-erlangen.de', 
      name: 'Matin Faal' 
    }
  }
  
  console.log('📤 Sende n8n-Daten (Priorität 2)...')
  console.log('Card ID:', n8nData.data.item.id)
  console.log('Liste Name:', n8nData.data.included.lists[0].name)
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': webhookToken
      },
      body: JSON.stringify(n8nData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Webhook erfolgreich')
      console.log('📊 Antwort:', JSON.stringify(result, null, 2))
      
      if (result.task) {
        console.log(`🎯 Task aktualisiert: ${result.task.id}`)
        console.log(`   Priorität: ${result.task.priority}`)
        console.log(`   Status: ${result.task.status}`)
      } else {
        console.log('❌ Keine Task in der Antwort')
      }
    } else {
      console.log('❌ Webhook fehlgeschlagen:', response.status)
      console.log('📊 Fehler:', JSON.stringify(result, null, 2))
    }
    
  } catch (error) {
    console.log('❌ Netzwerk-Fehler:', error.message)
  }
  
  // Überprüfe die Datenbank
  console.log('\n🔍 Überprüfe Datenbank...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('external_id', '1614531618771305515')
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.log('❌ Fehler beim Abrufen der Tasks:', error.message)
    } else if (tasks && tasks.length > 0) {
      console.log(`📋 Gefundene Tasks: ${tasks.length}`)
      tasks.forEach((task, index) => {
        console.log(`\n📝 Task ${index + 1}:`)
        console.log(`   ID: ${task.id}`)
        console.log(`   Titel: ${task.title}`)
        console.log(`   Priorität: ${task.priority}`)
        console.log(`   Status: ${task.status}`)
        console.log(`   Label: ${task.label}`)
        console.log(`   Aktualisiert: ${task.updated_at}`)
      })
    } else {
      console.log('❌ Keine Tasks in Datenbank gefunden')
    }
  }
}

testN8nOutput()
