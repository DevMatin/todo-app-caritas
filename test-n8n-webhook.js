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

async function testN8nWebhook() {
  console.log('🧪 Test: n8n Webhook Simulation')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase-Konfiguration fehlt!')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Simuliere verschiedene n8n Webhook-Szenarien
  const testScenarios = [
    {
      name: 'Priorität 1 - moveCard Event',
      webhookData: {
        event: 'actionCreate',
        data: {
          item: {
            type: 'moveCard',
            data: {
              card: { name: 'Test Task Priorität 1' },
              fromList: { name: 'Priorität 2' },
              toList: { name: 'Priorität 1', id: 'list1' }
            }
          },
          cardId: 'test-card-1'
        },
        user: { email: 'test@example.com', name: 'Test User' }
      }
    },
    {
      name: 'Priorität 2 - cardUpdate Event',
      webhookData: {
        event: 'cardUpdate',
        data: {
          item: {
            id: 'test-card-2',
            name: 'Test Task Priorität 2',
            description: 'Test Description',
            listId: 'list2'
          },
          included: {
            lists: [{ id: 'list2', name: 'Priorität 2' }]
          }
        },
        user: { email: 'test@example.com', name: 'Test User' }
      }
    },
    {
      name: 'Priorität 3 - cardUpdate Event',
      webhookData: {
        event: 'cardUpdate',
        data: {
          item: {
            id: 'test-card-3',
            name: 'Test Task Priorität 3',
            description: 'Test Description',
            listId: 'list3'
          },
          included: {
            lists: [{ id: 'list3', name: 'Priorität 3' }]
          }
        },
        user: { email: 'test@example.com', name: 'Test User' }
      }
    }
  ]
  
  console.log('\n📋 Test-Szenarien:')
  testScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`)
  })
  
  // Simuliere die Webhook-Verarbeitung
  for (const scenario of testScenarios) {
    console.log(`\n🔍 Teste: ${scenario.name}`)
    
    const body = scenario.webhookData
    let card, included, listName
    
    // Extrahiere Daten basierend auf Event-Typ (wie im Webhook)
    if (body.event === 'actionCreate' && body.data?.item?.type === 'moveCard') {
      const actionData = body.data.item.data
      card = {
        id: body.data.cardId,
        name: actionData.card.name,
        description: '',
        dueDate: null,
        listId: actionData.toList.id
      }
      included = body.data.included
      listName = actionData.toList.name
    } else if (body.event === 'cardUpdate') {
      card = body.data?.item
      included = body.data?.included
      const currentList = included?.lists?.find((list) => list.id === card?.listId)
      listName = currentList ? currentList.name : 'Unbekannt'
    }
    
    // Priorität ableiten (wie im Webhook)
    let priority = 'Priorität 2' // Default
    if (listName === 'Priorität 1') priority = 'Priorität 1'
    else if (listName === 'Priorität 2') priority = 'Priorität 2'
    else if (listName === 'Priorität 3') priority = 'Priorität 3'
    else if (listName.includes('hoch') || listName.includes('Hoch')) priority = 'Priorität 1'
    else if (listName.includes('niedrig') || listName.includes('Niedrig')) priority = 'Priorität 3'
    
    // Status ableiten
    let status = 'offen'
    if (listName === 'Priorität 1') status = 'in_bearbeitung'
    else if (listName === 'Erledigt') status = 'erledigt'
    
    console.log(`   Card: ${card?.name}`)
    console.log(`   Liste: ${listName}`)
    console.log(`   Priorität: ${priority}`)
    console.log(`   Status: ${status}`)
    
    // Teste ob die Prioritäts-Logik korrekt funktioniert
    const expectedPriority = listName.includes('Priorität 1') ? 'Priorität 1' : 
                            listName.includes('Priorität 2') ? 'Priorität 2' : 
                            listName.includes('Priorität 3') ? 'Priorität 3' : 'Priorität 2'
    
    if (priority === expectedPriority) {
      console.log(`   ✅ Prioritäts-Logik korrekt`)
    } else {
      console.log(`   ❌ Prioritäts-Logik fehlerhaft: erwartet ${expectedPriority}, erhalten ${priority}`)
    }
  }
  
  console.log('\n🔍 Mögliche Probleme:')
  console.log('1. n8n sendet nicht die erwarteten Daten')
  console.log('2. Liste-Namen stimmen nicht überein')
  console.log('3. Webhook-Token ist falsch')
  console.log('4. Event-Typ wird nicht korrekt verarbeitet')
  
  console.log('\n📝 Debugging-Schritte:')
  console.log('1. Überprüfen Sie die n8n Webhook-Logs')
  console.log('2. Schauen Sie sich die vollständigen n8n-Daten an')
  console.log('3. Vergleichen Sie die Liste-Namen mit den erwarteten Werten')
  console.log('4. Testen Sie mit echten n8n-Daten')
}

testN8nWebhook()
