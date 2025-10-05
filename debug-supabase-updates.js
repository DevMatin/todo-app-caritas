/**
 * Debug-Script für Supabase-Updates
 * 
 * Dieses Script testet verschiedene Szenarien um herauszufinden,
 * warum sich die Prioritätswerte in Supabase nicht ändern.
 */

const fetch = require('node-fetch');

// Konfiguration
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/n8n';
const WEBHOOK_TOKEN = 'caritas-webhook-token-2024';

// Test-Daten für actionCreate Event (Priorität 2 → Priorität 1)
const testPayload = {
  "event": "actionCreate",
  "data": {
    "item": {
      "id": "1614855090517050438",
      "createdAt": "2025-10-05T20:48:48.065Z",
      "updatedAt": null,
      "type": "moveCard",
      "data": {
        "card": {
          "name": "Heizung Reparatur"
        },
        "toList": {
          "id": "1614518997112325149",
          "name": "Priorität 1",
          "type": "active"
        },
        "fromList": {
          "id": "1614519127639065633",
          "name": "Priorität 2",
          "type": "active"
        }
      },
      "boardId": "1614518365206873097",
      "cardId": "1614531618771305515",
      "userId": "1614516758478062595"
    },
    "included": {
      "projects": [
        {
          "id": "1614518330226377735",
          "name": "Mozartstraße",
          "description": "Geschäftsstelle"
        }
      ],
      "boards": [
        {
          "id": "1614518365206873097",
          "name": "EG"
        }
      ],
      "lists": [
        {
          "id": "1614518997112325149",
          "name": "Priorität 1",
          "type": "active"
        }
      ],
      "cards": [
        {
          "id": "1614531618771305515",
          "name": "Heizung Reparatur",
          "description": "Heizung Tropft",
          "dueDate": "2025-10-13T10:00:00.000Z",
          "listId": "1614518997112325149"
        }
      ]
    }
  },
  "user": {
    "id": "1614516758478062595",
    "email": "faal@caritas-erlangen.de",
    "name": "Matin Faal"
  }
};

async function testWebhookConnection() {
  console.log('🔍 Teste Webhook-Verbindung...');
  
  try {
    // Test 1: Health Check
    console.log('\n📡 Test 1: Health Check');
    const healthResponse = await fetch(WEBHOOK_URL, {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Webhook ist erreichbar:', healthData);
    } else {
      console.log('❌ Webhook nicht erreichbar:', healthResponse.status);
      return false;
    }
    
    // Test 2: Webhook mit korrektem Token
    console.log('\n📡 Test 2: Webhook mit korrektem Token');
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': WEBHOOK_TOKEN
      },
      body: JSON.stringify(testPayload)
    });
    
    const webhookData = await webhookResponse.json();
    
    if (webhookResponse.ok) {
      console.log('✅ Webhook erfolgreich verarbeitet!');
      console.log('📋 Antwort:', JSON.stringify(webhookData, null, 2));
      
      // Prüfe ob Task erstellt/aktualisiert wurde
      if (webhookData.task) {
        console.log('✅ Task wurde verarbeitet:');
        console.log(`   ID: ${webhookData.task.id}`);
        console.log(`   Titel: ${webhookData.task.title}`);
        console.log(`   Priorität: ${webhookData.task.priority}`);
        console.log(`   Status: ${webhookData.task.status}`);
        console.log(`   Label: ${webhookData.task.label}`);
      } else {
        console.log('⚠️ Keine Task-Informationen in der Antwort');
      }
      
      return true;
    } else {
      console.log('❌ Webhook fehlgeschlagen:', webhookResponse.status);
      console.log('📋 Fehler:', JSON.stringify(webhookData, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Verbindungsfehler:', error.message);
    return false;
  }
}

async function testWebhookWithoutToken() {
  console.log('\n📡 Test 3: Webhook ohne Token (sollte fehlschlagen)');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Kein Token!
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Authentifizierung funktioniert korrekt (401 Unauthorized)');
      console.log('📋 Antwort:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Authentifizierung funktioniert nicht! Status:', response.status);
      console.log('📋 Antwort:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Fehler:', error.message);
  }
}

async function testWebhookWithWrongToken() {
  console.log('\n📡 Test 4: Webhook mit falschem Token (sollte fehlschlagen)');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': 'falscher-token'
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Token-Validierung funktioniert korrekt (401 Unauthorized)');
      console.log('📋 Antwort:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Token-Validierung funktioniert nicht! Status:', response.status);
      console.log('📋 Antwort:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Fehler:', error.message);
  }
}

async function testCardUpdateEvent() {
  console.log('\n📡 Test 5: cardUpdate Event (Priorität 1 → Priorität 3)');
  
  const cardUpdatePayload = {
    "event": "cardUpdate",
    "data": {
      "item": {
        "id": "1614531618771305515",
        "name": "Heizung Reparatur",
        "description": "Heizung Tropft",
        "dueDate": "2025-10-13T10:00:00.000Z",
        "listId": "1614519463216940072" // Priorität 3
      },
      "included": {
        "lists": [
          {
            "id": "1614519463216940072",
            "name": "Priorität 3"
          }
        ]
      }
    },
    "user": {
      "email": "faal@caritas-erlangen.de",
      "name": "Matin Faal"
    }
  };
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': WEBHOOK_TOKEN
      },
      body: JSON.stringify(cardUpdatePayload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ cardUpdate erfolgreich verarbeitet!');
      console.log('📋 Antwort:', JSON.stringify(data, null, 2));
      
      if (data.card?.priority === 'Priorität 3') {
        console.log('✅ Priorität korrekt auf "Priorität 3" gesetzt');
      } else {
        console.log(`❌ Priorität falsch: ${data.card?.priority} (erwartet: Priorität 3)`);
      }
    } else {
      console.log('❌ cardUpdate fehlgeschlagen:', response.status);
      console.log('📋 Fehler:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Fehler:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starte Debug-Tests für Supabase-Updates...');
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🔑 Token: ${WEBHOOK_TOKEN}`);
  
  // Test 1: Verbindung
  const connectionOk = await testWebhookConnection();
  
  if (!connectionOk) {
    console.log('\n❌ Grundlegende Verbindung fehlgeschlagen. Prüfe:');
    console.log('   - Ist die Todo-App gestartet? (npm run dev)');
    console.log('   - Ist die Webhook-URL korrekt?');
    console.log('   - Sind alle Umgebungsvariablen gesetzt?');
    return;
  }
  
  // Test 2: Authentifizierung
  await testWebhookWithoutToken();
  await testWebhookWithWrongToken();
  
  // Test 3: Verschiedene Event-Typen
  await testCardUpdateEvent();
  
  console.log('\n✨ Debug-Tests abgeschlossen!');
  console.log('\n📝 Nächste Schritte:');
  console.log('   1. Prüfe die Logs der Todo-App für Datenbank-Fehler');
  console.log('   2. Prüfe ob RLS in Supabase aktiviert ist');
  console.log('   3. Prüfe die n8n-Konfiguration');
  console.log('   4. Prüfe die Umgebungsvariablen (DATABASE_URL, etc.)');
}

// Tests ausführen
runAllTests().catch(console.error);
