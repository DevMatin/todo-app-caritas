#!/usr/bin/env node

/**
 * Test-Script für Planka Webhook Integration
 * Simuliert die Daten, die von n8n ankommen
 */

const testData = {
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
        "updatedAt": "2025-10-05T12:26:53.463Z",
        "type": "project",
        "position": 65536,
        "name": "Heizung Reparatur",
        "description": "Heizung Tropft",
        "dueDate": "2025-10-13T10:00:00.000Z",
        "stopwatch": null,
        "commentsTotal": 0,
        "listChangedAt": "2025-10-05T12:26:53.459Z",
        "boardId": "1614518365206873097",
        "listId": "1614519127639065633",
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
            "id": "1614519127639065633",
            "createdAt": "2025-10-05T09:41:18.171Z",
            "updatedAt": null,
            "type": "active",
            "position": 196608,
            "name": "Priorität 2",
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
        "updatedAt": "2025-10-05T10:58:28.422Z",
        "type": "project",
        "position": 65536,
        "name": "Heizung Reparatur",
        "description": "Heizung Tropft",
        "dueDate": "2025-10-13T10:00:00.000Z",
        "stopwatch": null,
        "commentsTotal": 0,
        "listChangedAt": "2025-10-05T10:58:28.421Z",
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

async function testWebhook() {
  const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/n8n'
  const token = process.env.INBOUND_WEBHOOK_TOKEN || 'caritas-webhook-token-2024'
  
  console.log('🧪 Teste Planka Webhook Integration...')
  console.log('📡 Webhook URL:', webhookUrl)
  console.log('🔑 Token:', token ? '✅ Vorhanden' : '❌ Fehlt')
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': token
      },
      body: JSON.stringify(testData.body)
    })
    
    const result = await response.json()
    
    console.log('\n📊 Response Status:', response.status)
    console.log('📋 Response Body:', JSON.stringify(result, null, 2))
    
    if (response.ok) {
      console.log('\n✅ Webhook-Test erfolgreich!')
      console.log('📝 Extrahierte Daten:')
      console.log('   - Event:', testData.body.event)
      console.log('   - Card Name:', testData.body.data.item.name)
      console.log('   - Beschreibung:', testData.body.data.item.description)
      console.log('   - Deadline:', testData.body.data.item.dueDate)
      console.log('   - Aktuelle Liste:', testData.body.data.included.lists[0].name)
      console.log('   - Vorherige Liste:', testData.body.prevData.included.lists[0].name)
      console.log('   - User:', testData.body.user.name, '(' + testData.body.user.email + ')')
    } else {
      console.log('\n❌ Webhook-Test fehlgeschlagen!')
    }
    
  } catch (error) {
    console.error('\n💥 Fehler beim Webhook-Test:', error.message)
  }
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  testWebhook()
}

module.exports = { testWebhook, testData }
