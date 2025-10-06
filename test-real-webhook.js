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

async function testRealWebhook() {
  console.log('🧪 Test: Echter n8n Webhook')
  
  const webhookToken = process.env.INBOUND_WEBHOOK_TOKEN
  const webhookUrl = 'http://localhost:3000/api/webhooks/n8n'
  
  console.log('🔑 Webhook Token:', webhookToken ? 'Gesetzt' : 'FEHLT')
  console.log('🔗 Webhook URL:', webhookUrl)
  
  if (!webhookToken) {
    console.error('❌ INBOUND_WEBHOOK_TOKEN fehlt in .env.local')
    return
  }
  
  // Teste verschiedene Webhook-Szenarien mit echten HTTP-Requests
  const testCases = [
    {
      name: 'Priorität 1 Test',
      data: {
        event: 'cardUpdate',
        data: {
          item: {
            id: 'test-card-prio1',
            name: 'Test Task Priorität 1',
            description: 'Test Description',
            listId: 'list-prio1'
          },
          included: {
            lists: [{ id: 'list-prio1', name: 'Priorität 1' }]
          }
        },
        user: { email: 'test@example.com', name: 'Test User' }
      }
    },
    {
      name: 'Priorität 2 Test',
      data: {
        event: 'cardUpdate',
        data: {
          item: {
            id: 'test-card-prio2',
            name: 'Test Task Priorität 2',
            description: 'Test Description',
            listId: 'list-prio2'
          },
          included: {
            lists: [{ id: 'list-prio2', name: 'Priorität 2' }]
          }
        },
        user: { email: 'test@example.com', name: 'Test User' }
      }
    },
    {
      name: 'Priorität 3 Test',
      data: {
        event: 'cardUpdate',
        data: {
          item: {
            id: 'test-card-prio3',
            name: 'Test Task Priorität 3',
            description: 'Test Description',
            listId: 'list-prio3'
          },
          included: {
            lists: [{ id: 'list-prio3', name: 'Priorität 3' }]
          }
        },
        user: { email: 'test@example.com', name: 'Test User' }
      }
    }
  ]
  
  console.log('\n📋 Teste Webhook-Endpoint...')
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Teste: ${testCase.name}`)
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Token': webhookToken
        },
        body: JSON.stringify(testCase.data)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log(`   ✅ Webhook erfolgreich`)
        console.log(`   📊 Antwort:`, JSON.stringify(result, null, 2))
        
        if (result.card?.priority) {
          console.log(`   🎯 Priorität gesetzt: ${result.card.priority}`)
        }
      } else {
        console.log(`   ❌ Webhook fehlgeschlagen: ${response.status}`)
        console.log(`   📊 Fehler:`, JSON.stringify(result, null, 2))
      }
      
    } catch (error) {
      console.log(`   ❌ Netzwerk-Fehler:`, error.message)
      console.log(`   💡 Stellen Sie sicher, dass der Server läuft: npm run dev`)
    }
  }
  
  console.log('\n🔍 Debugging-Tipps:')
  console.log('1. Starten Sie den Server: npm run dev')
  console.log('2. Überprüfen Sie die Server-Logs für Webhook-Details')
  console.log('3. Vergleichen Sie die n8n-Daten mit den Test-Daten')
  console.log('4. Überprüfen Sie die Liste-Namen in n8n')
}

testRealWebhook()
