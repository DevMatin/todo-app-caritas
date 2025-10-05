# n8n Konfiguration für Planka → Todo-App Integration

## Workflow Übersicht

```
Planka Webhook → n8n HTTP Request → Todo-App Webhook
```

## n8n Node-Konfiguration

### 1. **Webhook Node (Trigger)**
**Node-Typ:** Webhook

**Konfiguration:**
- **HTTP Method:** POST
- **Path:** `/planka-webhook` (oder beliebig)
- **Response Mode:** "On Received"
- **Authentication:** None

**Webhook URL:** `https://your-n8n-instance.com/webhook/planka-webhook`

### 2. **HTTP Request Node (an Todo-App)**
**Node-Typ:** HTTP Request

**Konfiguration:**
- **Method:** POST
- **URL:** `https://your-todo-app.vercel.app/api/webhooks/n8n`
- **Authentication:** None
- **Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "X-Webhook-Token": "caritas-webhook-token-2024"
  }
  ```

**Body (JSON):**
```json
{
  "event": "{{ $json.event }}",
  "data": {
    "item": {
      "id": "{{ $json.data.item.id }}",
      "name": "{{ $json.data.item.name }}",
      "description": "{{ $json.data.item.description }}",
      "dueDate": "{{ $json.data.item.dueDate }}",
      "listId": "{{ $json.data.item.listId }}"
    },
    "included": {
      "lists": [
        {
          "id": "{{ $json.data.included.lists[0].id }}",
          "name": "{{ $json.data.included.lists[0].name }}"
        }
      ]
    }
  },
  "prevData": {
    "item": {
      "id": "{{ $json.prevData.item.id }}",
      "name": "{{ $json.prevData.item.name }}",
      "description": "{{ $json.prevData.item.description }}",
      "dueDate": "{{ $json.prevData.item.dueDate }}",
      "listId": "{{ $json.prevData.item.listId }}"
    },
    "included": {
      "lists": [
        {
          "id": "{{ $json.prevData.included.lists[0].id }}",
          "name": "{{ $json.prevData.included.lists[0].name }}"
        }
      ]
    }
  },
  "user": {
    "email": "{{ $json.user.email }}",
    "name": "{{ $json.user.name }}"
  }
}
```

## Erweiterte Konfiguration mit Prioritäts-Mapping

### Option 1: **Set Node für Prioritäts-Logik**
Füge einen **Set Node** zwischen Webhook und HTTP Request ein:

**Set Node Konfiguration:**
```json
{
  "listName": "{{ $json.data.included.lists[0].name }}",
  "priority": "{{ $json.data.included.lists[0].name === 'Priorität 1' ? 'hoch' : ($json.data.included.lists[0].name === 'Priorität 2' ? 'mittel' : ($json.data.included.lists[0].name === 'Priorität 3' ? 'niedrig' : 'mittel')) }}",
  "status": "{{ $json.data.included.lists[0].name === 'Priorität 1' ? 'in_bearbeitung' : ($json.data.included.lists[0].name === 'Erledigt' ? 'erledigt' : 'offen') }}"
}
```

### Option 2: **IF Node für komplexe Logik**
Verwende einen **IF Node** für detaillierte Prioritäts-Zuordnung:

**IF Node Bedingungen:**
1. **Priorität 1:** `{{ $json.data.included.lists[0].name === 'Priorität 1' }}`
2. **Priorität 2:** `{{ $json.data.included.lists[0].name === 'Priorität 2' }}`
3. **Priorität 3:** `{{ $json.data.included.lists[0].name === 'Priorität 3' }}`
4. **Erledigt:** `{{ $json.data.included.lists[0].name === 'Erledigt' }}`

## Vollständiger n8n Workflow

### Workflow JSON Export:
```json
{
  "name": "Planka to Todo-App Integration",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "planka-webhook",
        "responseMode": "onReceived"
      },
      "id": "webhook-trigger",
      "name": "Planka Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "listName",
              "value": "={{ $json.data.included.lists[0].name }}"
            },
            {
              "name": "priority",
              "value": "={{ $json.data.included.lists[0].name === 'Priorität 1' ? 'hoch' : ($json.data.included.lists[0].name === 'Priorität 2' ? 'mittel' : ($json.data.included.lists[0].name === 'Priorität 3' ? 'niedrig' : 'mittel')) }}"
            },
            {
              "name": "status",
              "value": "={{ $json.data.included.lists[0].name === 'Priorität 1' ? 'in_bearbeitung' : ($json.data.included.lists[0].name === 'Erledigt' ? 'erledigt' : 'offen') }}"
            }
          ]
        }
      },
      "id": "set-priority",
      "name": "Set Priority",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://your-todo-app.vercel.app/api/webhooks/n8n",
        "headers": {
          "Content-Type": "application/json",
          "X-Webhook-Token": "caritas-webhook-token-2024"
        },
        "body": {
          "event": "={{ $json.event }}",
          "data": {
            "item": {
              "id": "={{ $json.data.item.id }}",
              "name": "={{ $json.data.item.name }}",
              "description": "={{ $json.data.item.description }}",
              "dueDate": "={{ $json.data.item.dueDate }}",
              "listId": "={{ $json.data.item.listId }}"
            },
            "included": {
              "lists": [
                {
                  "id": "={{ $json.data.included.lists[0].id }}",
                  "name": "={{ $json.data.included.lists[0].name }}"
                }
              ]
            }
          },
          "prevData": {
            "item": {
              "id": "={{ $json.prevData.item.id }}",
              "name": "={{ $json.prevData.item.name }}",
              "description": "={{ $json.prevData.item.description }}",
              "dueDate": "={{ $json.prevData.item.dueDate }}",
              "listId": "={{ $json.prevData.item.listId }}"
            },
            "included": {
              "lists": [
                {
                  "id": "={{ $json.prevData.included.lists[0].id }}",
                  "name": "={{ $json.prevData.included.lists[0].name }}"
                }
              ]
            }
          },
          "user": {
            "email": "={{ $json.user.email }}",
            "name": "={{ $json.user.name }}"
          }
        }
      },
      "id": "http-request",
      "name": "Send to Todo-App",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [680, 300]
    }
  ],
  "connections": {
    "webhook-trigger": {
      "main": [
        [
          {
            "node": "set-priority",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "set-priority": {
      "main": [
        [
          {
            "node": "http-request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Prioritäts-Mapping Tabelle

| Planka Liste | Todo-App Priorität | Todo-App Status |
|--------------|-------------------|-----------------|
| Priorität 1  | hoch              | in_bearbeitung  |
| Priorität 2  | mittel            | offen           |
| Priorität 3  | niedrig           | offen           |
| Erledigt     | mittel            | erledigt        |

## Test-Konfiguration

### Test-Webhook URL:
```
https://your-n8n-instance.com/webhook/planka-webhook
```

### Test-Daten (deine Planka-Daten):
```json
{
  "event": "cardUpdate",
  "data": {
    "item": {
      "id": "1614531618771305515",
      "name": "Heizung Reparatur",
      "description": "Heizung Tropft",
      "dueDate": "2025-10-13T10:00:00.000Z",
      "listId": "1614519127639065633"
    },
    "included": {
      "lists": [
        {
          "id": "1614519127639065633",
          "name": "Priorität 2"
        }
      ]
    }
  },
  "user": {
    "email": "faal@caritas-erlangen.de",
    "name": "Matin Faal"
  }
}
```

## Erwartetes Ergebnis

Mit deinen Daten wird folgendes passieren:
- **Card:** "Heizung Reparatur"
- **Liste:** "Priorität 2"
- **Priorität:** mittel
- **Status:** offen
- **Deadline:** 13. Oktober 2025, 10:00 Uhr
