const { createClient } = require('@supabase/supabase-js')

async function testPriorityUpdate() {
  console.log('🧪 Test: Prioritäts-Update Simulation')
  
  // Simuliere n8n Webhook-Daten für Priorität 1, 2, 3
  const testCases = [
    {
      name: 'Priorität 1 Test',
      listName: 'Priorität 1',
      expectedPriority: 'Priorität 1',
      expectedStatus: 'in_bearbeitung'
    },
    {
      name: 'Priorität 2 Test', 
      listName: 'Priorität 2',
      expectedPriority: 'Priorität 2',
      expectedStatus: 'offen'
    },
    {
      name: 'Priorität 3 Test',
      listName: 'Priorität 3', 
      expectedPriority: 'Priorität 3',
      expectedStatus: 'offen'
    }
  ]
  
  console.log('\n📋 Test-Fälle:')
  testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}`)
    console.log(`   Liste: ${testCase.listName}`)
    console.log(`   Erwartete Priorität: ${testCase.expectedPriority}`)
    console.log(`   Erwarteter Status: ${testCase.expectedStatus}`)
  })
  
  // Simuliere die Prioritäts-Logik aus dem Webhook
  function simulatePriorityLogic(listName) {
    let priority = 'Priorität 2' // Default
    if (listName === 'Priorität 1') priority = 'Priorität 1'
    else if (listName === 'Priorität 2') priority = 'Priorität 2'
    else if (listName === 'Priorität 3') priority = 'Priorität 3'
    else if (listName.includes('hoch') || listName.includes('Hoch')) priority = 'Priorität 1'
    else if (listName.includes('niedrig') || listName.includes('Niedrig')) priority = 'Priorität 3'
    
    let status = 'offen'
    if (listName === 'Priorität 1') status = 'in_bearbeitung'
    else if (listName === 'Erledigt') status = 'erledigt'
    
    return { priority, status }
  }
  
  console.log('\n🔍 Teste Prioritäts-Logik:')
  testCases.forEach((testCase, index) => {
    const result = simulatePriorityLogic(testCase.listName)
    const priorityMatch = result.priority === testCase.expectedPriority
    const statusMatch = result.status === testCase.expectedStatus
    
    console.log(`\n${index + 1}. ${testCase.name}:`)
    console.log(`   Eingabe: ${testCase.listName}`)
    console.log(`   Ergebnis Priorität: ${result.priority} ${priorityMatch ? '✅' : '❌'}`)
    console.log(`   Ergebnis Status: ${result.status} ${statusMatch ? '✅' : '❌'}`)
    
    if (!priorityMatch || !statusMatch) {
      console.log(`   ❌ FEHLER: Erwartet Priorität ${testCase.expectedPriority}, Status ${testCase.expectedStatus}`)
    }
  })
  
  console.log('\n📝 Nächste Schritte:')
  console.log('1. Erstellen Sie eine .env.local Datei mit Supabase-Keys')
  console.log('2. Setzen Sie NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY')
  console.log('3. Testen Sie den n8n Webhook mit echten Daten')
  console.log('4. Überprüfen Sie die Logs für Prioritäts-Updates')
}

testPriorityUpdate()
