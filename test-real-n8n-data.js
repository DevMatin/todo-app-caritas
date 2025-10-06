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

async function testWebhookWithRealData() {
  console.log('🧪 Test: Webhook mit echten n8n-Daten')
  
  const webhookToken = process.env.INBOUND_WEBHOOK_TOKEN
  const webhookUrl = 'http://localhost:3000/api/webhooks/n8n'
  
  if (!webhookToken) {
    console.error('❌ INBOUND_WEBHOOK_TOKEN fehlt')
    return
  }
  
  // Simuliere die echten n8n-Daten aus Ihrem Output
  const realN8nData = {
    event: 'cardUpdate',
    data: {
      item: {
        id: '1614531618771305515',
        name: 'Heizung Reparatur',
        description: 'Heizung Tropft',
        dueDate: '2025-10-13T10:00:00.000Z',
        listId: 'list-prio1'
      },
      included: {
        lists: [{ id: 'list-prio1', name: 'Priorität 1' }]
      }
    },
    user: { 
      email: 'faal@caritas-erlangen.de', 
      name: 'Matin Faal' 
    }
  }
  
  console.log('📤 Sende echte n8n-Daten an Webhook...')
  console.log('Card ID:', realN8nData.data.item.id)
  console.log('Liste Name:', realN8nData.data.included.lists[0].name)
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': webhookToken
      },
      body: JSON.stringify(realN8nData)
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
        console.log('❌ Keine Task in der Antwort - möglicherweise Fehler beim Update')
      }
    } else {
      console.log('❌ Webhook fehlgeschlagen:', response.status)
      console.log('📊 Fehler:', JSON.stringify(result, null, 2))
    }
    
  } catch (error) {
    console.log('❌ Netzwerk-Fehler:', error.message)
  }
  
  // Überprüfe die Datenbank nach dem Test
  console.log('\n🔍 Überprüfe Datenbank nach Test...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('external_id', '1614531618771305515')
      .single()
    
    if (error) {
      console.log('❌ Fehler beim Abrufen der Task:', error.message)
    } else if (task) {
      console.log('📋 Task in Datenbank:')
      console.log(`   Priorität: ${task.priority}`)
      console.log(`   Status: ${task.status}`)
      console.log(`   Label: ${task.label}`)
      console.log(`   Aktualisiert: ${task.updated_at}`)
    } else {
      console.log('❌ Task nicht in Datenbank gefunden')
    }
  }
}

testWebhookWithRealData()
