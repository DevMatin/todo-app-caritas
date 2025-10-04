/**
 * Test-Script für Planka Webhook Integration
 * 
 * Verwendung:
 * 1. Stelle sicher, dass deine Todo App läuft (npm run dev)
 * 2. Führe dieses Script aus: node test-webhook.js
 * 3. Prüfe die Logs in deiner Todo App
 */

const testPayload = {
  "event": "cardUpdate",
  "data": {
    "item": {
      "id": "1614044660496335884",
      "createdAt": "2025-10-04T17:58:37.280Z",
      "updatedAt": "2025-10-04T18:59:46.344Z",
      "type": "project",
      "position": 16384,
      "name": "test",
      "description": "test",
      "dueDate": "2025-10-04T10:00:00.000Z",
      "stopwatch": null,
      "commentsTotal": 1,
      "listChangedAt": "2025-10-04T18:59:46.343Z",
      "boardId": "1614044552677557255",
      "listId": "1614044626514084875",
      "creatorUserId": "1614041863692485633",
      "prevListId": null,
      "coverAttachmentId": null
    },
    "included": {
      "projects": [
        {
          "id": "1614044520373027845",
          "createdAt": "2025-10-04T17:58:20.573Z",
          "updatedAt": "2025-10-04T17:58:20.585Z",
          "name": "test",
          "description": "tet",
          "backgroundType": null,
          "backgroundGradient": null,
          "isHidden": false,
          "ownerProjectManagerId": "1614044520398193670",
          "backgroundImageId": null
        }
      ],
      "boards": [
        {
          "id": "1614044552677557255",
          "createdAt": "2025-10-04T17:58:24.427Z",
          "updatedAt": "2025-10-04T17:58:25.871Z",
          "position": 65536,
          "name": "test",
          "defaultView": "kanban",
          "defaultCardType": "project",
          "limitCardTypesToDefaultOne": false,
          "alwaysDisplayCardCreator": false,
          "projectId": "1614044520373027845"
        }
      ],
      "lists": [
        {
          "id": "1614044626514084875",
          "createdAt": "2025-10-04T17:58:33.230Z",
          "updatedAt": null,
          "type": "active",
          "position": 65536,
          "name": "uns",
          "color": null,
          "boardId": "1614044552677557255"
        }
      ]
    }
  },
  "prevData": {
    "item": {
      "id": "1614044660496335884",
      "createdAt": "2025-10-04T17:58:37.280Z",
      "updatedAt": "2025-10-04T18:59:26.409Z",
      "type": "project",
      "position": 65536,
      "name": "test",
      "description": "test",
      "dueDate": "2025-10-04T10:00:00.000Z",
      "stopwatch": null,
      "commentsTotal": 1,
      "listChangedAt": "2025-10-04T18:59:26.408Z",
      "boardId": "1614044552677557255",
      "listId": "1614045903310554132",
      "creatorUserId": "1614041863692485633",
      "prevListId": null,
      "coverAttachmentId": null
    },
    "included": {
      "projects": [
        {
          "id": "1614044520373027845",
          "createdAt": "2025-10-04T17:58:20.573Z",
          "updatedAt": "2025-10-04T17:58:20.585Z",
          "name": "test",
          "description": "tet",
          "backgroundType": null,
          "backgroundGradient": null,
          "isHidden": false,
          "ownerProjectManagerId": "1614044520398193670",
          "backgroundImageId": null
        }
      ],
      "boards": [
        {
          "id": "1614044552677557255",
          "createdAt": "2025-10-04T17:58:24.427Z",
          "updatedAt": "2025-10-04T17:58:25.871Z",
          "position": 65536,
          "name": "test",
          "defaultView": "kanban",
          "defaultCardType": "project",
          "limitCardTypesToDefaultOne": false,
          "alwaysDisplayCardCreator": false,
          "projectId": "1614044520373027845"
        }
      ],
      "lists": [
        {
          "id": "1614045903310554132",
          "createdAt": "2025-10-04T18:01:05.431Z",
          "updatedAt": null,
          "type": "active",
          "position": 131072,
          "name": "test",
          "color": null,
          "boardId": "1614044552677557255"
        }
      ]
    }
  },
  "user": {
    "id": "1614041863692485633",
    "createdAt": "2025-10-04T17:53:03.874Z",
    "updatedAt": null,
    "email": "admin@caritas.de",
    "role": "admin",
    "name": "Caritas Admin",
    "username": "admin",
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
};

async function testWebhook() {
  const webhookUrl = 'https://namespace-filter-moments-self.trycloudflare.com/api/webhooks/n8n';

  console.log('🧪 Teste Webhook-Integration...');
  console.log('📡 URL:', webhookUrl);
  console.log('🔓 Authentifizierung: deaktiviert');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const responseText = await response.text();
    
    console.log('📊 Status:', response.status);
    console.log('📄 Response:', responseText);

    if (response.ok) {
      console.log('✅ Webhook-Test erfolgreich!');
    } else {
      console.log('❌ Webhook-Test fehlgeschlagen!');
    }

  } catch (error) {
    console.error('💥 Fehler beim Testen des Webhooks:', error);
  }
}

// Führe den Test aus
testWebhook();
