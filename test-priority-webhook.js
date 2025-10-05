/**
 * Test-Script für Prioritätsänderungen zwischen Planka und Todo-App
 * 
 * Dieses Script testet die neuen Webhook-Funktionalitäten für:
 * - actionCreate Events (moveCard)
 * - cardUpdate Events
 */

const fetch = require('node-fetch');

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/n8n';
const WEBHOOK_TOKEN = 'caritas-webhook-token-2024';

// Test-Daten aus den bereitgestellten Webhook-Payloads
const testData = {
  // actionCreate Event - Card von Priorität 2 zu Priorität 1
  actionCreate: {
    "headers": {
      "connection": "upgrade",
      "host": "n8n.faal.design",
      "x-real-ip": "172.18.0.3",
      "x-forwarded-for": "172.18.0.3",
      "x-forwarded-proto": "https",
      "content-length": "2243",
      "content-type": "application/json",
      "user-agent": "planka (+https://planka.faal.design)",
      "authorization": "Bearer caritas-webhook-token-2024",
      "accept": "*/*",
      "accept-language": "*",
      "sec-fetch-mode": "cors",
      "accept-encoding": "br, gzip, deflate"
    },
    "params": {},
    "query": {},
    "body": {
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
              "createdAt": "2025-10-05T09:39:43.109Z",
              "updatedAt": "2025-10-05T09:39:43.120Z",
              "name": "Mozartstraße",
              "description": "Geschäftsstelle",
              "backgroundType": null,
              "backgroundGradient": null,
              "isHidden": false,
              "ownerProjectManagerId": "1614518330259932168",
              "backgroundImageId": null
            }
          ],
          "boards": [
            {
              "id": "1614518365206873097",
              "createdAt": "2025-10-05T09:39:47.283Z",
              "updatedAt": null,
              "position": 65536,
              "name": "EG",
              "defaultView": "kanban",
              "defaultCardType": "project",
              "limitCardTypesToDefaultOne": false,
              "alwaysDisplayCardCreator": false,
              "projectId": "1614518330226377735"
            }
          ],
          "lists": [
            {
              "id": "1614518997112325149",
              "createdAt": "2025-10-05T09:41:02.608Z",
              "updatedAt": null,
              "type": "active",
              "position": 131072,
              "name": "Priorität 1",
              "color": null,
              "boardId": "1614518365206873097"
            }
          ],
          "cards": [
            {
              "id": "1614531618771305515",
              "createdAt": "2025-10-05T10:06:07.228Z",
              "updatedAt": "2025-10-05T20:48:48.061Z",
              "type": "project",
              "position": 65536,
              "name": "Heizung Reparatur",
              "description": "Heizung Tropft",
              "dueDate": "2025-10-13T10:00:00.000Z",
              "stopwatch": null,
              "commentsTotal": 0,
              "listChangedAt": "2025-10-05T20:48:48.060Z",
              "boardId": "1614518365206873097",
              "listId": "1614518997112325149",
              "creatorUserId": "1614516758478062595",
              "prevListId": null,
              "coverAttachmentId": null
            }
          ]
        }
      },
      "user": {
        "id": "1614516758478062595",
        "createdAt": "2025-10-05T09:36:35.741Z",
        "updatedAt": "2025-10-05T09:39:17.441Z",
        "email": "faal@caritas-erlangen.de",
        "role": "admin",
        "name": "Matin Faal",
        "username": null,
        "phone": null,
        "organization": null,
        "language": null,
        "subscribeToOwnCards": false,
        "subscribeToCardWhenCommenting": true,
        "turnOffRecentCardHighlighting": false,
        "enableFavoritesByDefault": false,
        "defaultEditorMode": "wysiwyg",
        "defaultHomeView": "groupedProjects",
        "defaultProjectsOrder": "byDefault",
        "isSsoUser": false,
        "isDeactivated": false,
        "avatar": null
      }
    },
    "webhookUrl": "https://n8n.faal.design/webhook-test/100ae879-plnka-caritas",
    "executionMode": "test"
  },

  // cardUpdate Event - Card von Priorität 1 zu Priorität 3
  cardUpdate: {
    "headers": {
      "connection": "upgrade",
      "host": "n8n.faal.design",
      "x-real-ip": "172.18.0.3",
      "x-forwarded-for": "172.18.0.3",
      "x-forwarded-proto": "https",
      "content-length": "3112",
      "content-type": "application/json",
      "user-agent": "planka (+https://planka.faal.design)",
      "authorization": "Bearer caritas-webhook-token-2024",
      "accept": "*/*",
      "accept-language": "*",
      "sec-fetch-mode": "cors",
      "accept-encoding": "br, gzip, deflate"
    },
    "params": {},
    "query": {},
    "body": {
      "event": "cardUpdate",
      "data": {
        "item": {
          "id": "1614531618771305515",
          "createdAt": "2025-10-05T10:06:07.228Z",
          "updatedAt": "2025-10-05T20:50:28.593Z",
          "type": "project",
          "position": 65536,
          "name": "Heizung Reparatur",
          "description": "Heizung Tropft",
          "dueDate": "2025-10-13T10:00:00.000Z",
          "stopwatch": null,
          "commentsTotal": 0,
          "listChangedAt": "2025-10-05T20:50:28.591Z",
          "boardId": "1614518365206873097",
          "listId": "1614519463216940072",
          "creatorUserId": "1614516758478062595",
          "prevListId": null,
          "coverAttachmentId": null
        },
        "included": {
          "projects": [
            {
              "id": "1614518330226377735",
              "createdAt": "2025-10-05T09:39:43.109Z",
              "updatedAt": "2025-10-05T09:39:43.120Z",
              "name": "Mozartstraße",
              "description": "Geschäftsstelle",
              "backgroundType": null,
              "backgroundGradient": null,
              "isHidden": false,
              "ownerProjectManagerId": "1614518330259932168",
              "backgroundImageId": null
            }
          ],
          "boards": [
            {
              "id": "1614518365206873097",
              "createdAt": "2025-10-05T09:39:47.283Z",
              "updatedAt": null,
              "position": 65536,
              "name": "EG",
              "defaultView": "kanban",
              "defaultCardType": "project",
              "limitCardTypesToDefaultOne": false,
              "alwaysDisplayCardCreator": false,
              "projectId": "1614518330226377735"
            }
          ],
          "lists": [
            {
              "id": "1614519463216940072",
              "createdAt": "2025-10-05T09:41:58.175Z",
              "updatedAt": null,
              "type": "active",
              "position": 262144,
              "name": "Priorität 3",
              "color": null,
              "boardId": "1614518365206873097"
            }
          ]
        }
      },
      "prevData": {
        "item": {
          "id": "1614531618771305515",
          "createdAt": "2025-10-05T10:06:07.228Z",
          "updatedAt": "2025-10-05T20:48:48.061Z",
          "type": "project",
          "position": 65536,
          "name": "Heizung Reparatur",
          "description": "Heizung Tropft",
          "dueDate": "2025-10-13T10:00:00.000Z",
          "stopwatch": null,
          "commentsTotal": 0,
          "listChangedAt": "2025-10-05T20:48:48.060Z",
          "boardId": "1614518365206873097",
          "listId": "1614518997112325149",
          "creatorUserId": "1614516758478062595",
          "prevListId": null,
          "coverAttachmentId": null
        },
        "included": {
          "projects": [
            {
              "id": "1614518330226377735",
              "createdAt": "2025-10-05T09:39:43.109Z",
              "updatedAt": "2025-10-05T09:39:43.120Z",
              "name": "Mozartstraße",
              "description": "Geschäftsstelle",
              "backgroundType": null,
              "backgroundGradient": null,
              "isHidden": false,
              "ownerProjectManagerId": "1614518330259932168",
              "backgroundImageId": null
            }
          ],
          "boards": [
            {
              "id": "1614518365206873097",
              "createdAt": "2025-10-05T09:39:47.283Z",
              "updatedAt": null,
              "position": 65536,
              "name": "EG",
              "defaultView": "kanban",
              "defaultCardType": "project",
              "limitCardTypesToDefaultOne": false,
              "alwaysDisplayCardCreator": false,
              "projectId": "1614518330226377735"
            }
          ],
          "lists": [
            {
              "id": "1614518997112325149",
              "createdAt": "2025-10-05T09:41:02.608Z",
              "updatedAt": null,
              "type": "active",
              "position": 131072,
              "name": "Priorität 1",
              "color": null,
              "boardId": "1614518365206873097"
            }
          ]
        }
      },
      "user": {
        "id": "1614516758478062595",
        "createdAt": "2025-10-05T09:36:35.741Z",
        "updatedAt": "2025-10-05T09:39:17.441Z",
        "email": "faal@caritas-erlangen.de",
        "role": "admin",
        "name": "Matin Faal",
        "username": null,
        "phone": null,
        "organization": null,
        "language": null,
        "subscribeToOwnCards": false,
        "subscribeToCardWhenCommenting": true,
        "turnOffRecentCardHighlighting": false,
        "enableFavoritesByDefault": false,
        "defaultEditorMode": "wysiwyg",
        "defaultHomeView": "groupedProjects",
        "defaultProjectsOrder": "byDefault",
        "isSsoUser": false,
        "isDeactivated": false,
        "avatar": null
      }
    },
    "webhookUrl": "https://n8n.faal.design/webhook-test/100ae879-plnka-caritas",
    "executionMode": "test"
  }
};

async function testWebhook(eventType, testPayload) {
  console.log(`\n🧪 Teste ${eventType} Event...`);
  console.log(`📤 Sende Webhook an: ${WEBHOOK_URL}`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': WEBHOOK_TOKEN
      },
      body: JSON.stringify(testPayload.body)
    });

    const responseData = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${eventType} erfolgreich verarbeitet!`);
      console.log(`📋 Antwort:`, JSON.stringify(responseData, null, 2));
      
      // Erwartete Werte prüfen
      if (eventType === 'actionCreate') {
        const expectedPriority = 'Priorität 1';
        const expectedStatus = 'in_bearbeitung';
        const expectedLabel = 'hoch';
        
        console.log(`🔍 Erwartete Werte:`);
        console.log(`   Priorität: ${expectedPriority}`);
        console.log(`   Status: ${expectedStatus}`);
        console.log(`   Label: ${expectedLabel}`);
        
        if (responseData.card?.priority === expectedPriority) {
          console.log(`✅ Priorität korrekt: ${responseData.card.priority}`);
        } else {
          console.log(`❌ Priorität falsch: ${responseData.card?.priority} (erwartet: ${expectedPriority})`);
        }
      } else if (eventType === 'cardUpdate') {
        const expectedPriority = 'Priorität 3';
        const expectedStatus = 'offen';
        const expectedLabel = 'niedrig';
        
        console.log(`🔍 Erwartete Werte:`);
        console.log(`   Priorität: ${expectedPriority}`);
        console.log(`   Status: ${expectedStatus}`);
        console.log(`   Label: ${expectedLabel}`);
        
        if (responseData.card?.priority === expectedPriority) {
          console.log(`✅ Priorität korrekt: ${responseData.card.priority}`);
        } else {
          console.log(`❌ Priorität falsch: ${responseData.card?.priority} (erwartet: ${expectedPriority})`);
        }
      }
    } else {
      console.log(`❌ ${eventType} fehlgeschlagen: ${response.status} ${response.statusText}`);
      console.log(`📋 Fehler-Details:`, JSON.stringify(responseData, null, 2));
    }
  } catch (error) {
    console.log(`❌ Fehler beim Testen von ${eventType}:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starte Webhook-Tests für Prioritätsänderungen...');
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🔑 Token: ${WEBHOOK_TOKEN}`);
  
  // Test 1: actionCreate Event (moveCard von Priorität 2 zu Priorität 1)
  await testWebhook('actionCreate', testData.actionCreate);
  
  // Kurze Pause zwischen Tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: cardUpdate Event (Card von Priorität 1 zu Priorität 3)
  await testWebhook('cardUpdate', testData.cardUpdate);
  
  console.log('\n✨ Tests abgeschlossen!');
}

// Tests ausführen
runTests().catch(console.error);
