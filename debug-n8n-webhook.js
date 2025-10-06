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

async function debugN8nWebhook() {
  console.log('🔍 Debug: n8n Webhook Problem')
  
  const webhookToken = process.env.INBOUND_WEBHOOK_TOKEN
  const webhookUrl = 'http://localhost:3000/api/webhooks/n8n'
  
  console.log('🔑 Webhook Token:', webhookToken ? 'Gesetzt' : 'FEHLT')
  console.log('🔗 Webhook URL:', webhookUrl)
  
  if (!webhookToken) {
    console.error('❌ INBOUND_WEBHOOK_TOKEN fehlt in .env.local')
    return
  }
  
  console.log('\n📋 Mögliche n8n-Datenformate:')
  
  // Teste verschiedene n8n-Datenformate
  const testFormats = [
    {
      name: 'Format 1: Direkte n8n-Daten',
      data: {
        card: {
          id: '1614531618771305515',
          name: 'Heizung Reparatur',
          description: 'Heizung Tropft',
          listName: 'Priorität 1'
        },
        user: {
          email: 'faal@caritas-erlangen.de',
          name: 'Matin Faal'
        }
      }
    },
    {
      name: 'Format 2: Planka cardUpdate',
      data: {
        event: 'cardUpdate',
        data: {
          item: {
            id: '1614531618771305515',
            name: 'Heizung Reparatur',
            description: 'Heizung Tropft',
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
    },
    {
      name: 'Format 3: Planka actionCreate (moveCard)',
      data: {
        event: 'actionCreate',
        data: {
          item: {
            type: 'moveCard',
            data: {
              card: { name: 'Heizung Reparatur' },
              fromList: { name: 'Priorität 2' },
              toList: { name: 'Priorität 1', id: 'list-prio1' }
            }
          },
          cardId: '1614531618771305515',
          included: {
            lists: [{ id: 'list-prio1', name: 'Priorität 1' }]
          }
        },
        user: {
          email: 'faal@caritas-erlangen.de',
          name: 'Matin Faal'
        }
      }
    }
  ]
  
  for (const format of testFormats) {
    console.log(`\n🧪 Teste: ${format.name}`)
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Token': webhookToken
        },
        body: JSON.stringify(format.data)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log(`   ✅ Erfolgreich`)
        if (result.task) {
          console.log(`   📊 Task erstellt: ${result.task.id}`)
          console.log(`   🎯 Priorität: ${result.task.priority}`)
        } else {
          console.log(`   ❌ Keine Task erstellt`)
        }
      } else {
        console.log(`   ❌ Fehlgeschlagen: ${response.status}`)
        console.log(`   📊 Fehler:`, JSON.stringify(result, null, 2))
      }
      
    } catch (error) {
      console.log(`   ❌ Netzwerk-Fehler:`, error.message)
    }
  }
  
  console.log('\n🔍 Debugging-Schritte für n8n:')
  console.log('1. Starten Sie den Server: npm run dev')
  console.log('2. Senden Sie einen Test von n8n')
  console.log('3. Schauen Sie die Server-Logs für:')
  console.log('   - "Webhook: VOLLSTÄNDIGE n8n-DATEN"')
  console.log('   - "Webhook: n8n-Format - Card: ..."')
  console.log('   - "Webhook: Task nicht gefunden - erstelle neue Task"')
  console.log('   - "Webhook: Datenbank-Fehler"')
  
  console.log('\n📝 Häufige Probleme:')
  console.log('- n8n sendet andere Datenstruktur als erwartet')
  console.log('- Webhook-Token stimmt nicht überein')
  console.log('- Liste-Namen stimmen nicht überein')
  console.log('- Event-Typ wird nicht erkannt')
}

debugN8nWebhook()
