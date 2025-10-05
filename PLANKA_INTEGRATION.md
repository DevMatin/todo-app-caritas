# Planka Integration für Todo-App Caritas

Diese Dokumentation beschreibt die Integration zwischen Planka und der Todo-App über n8n.

## Übersicht

Die Integration ermöglicht es, dass Änderungen in Planka automatisch als Tasks in der Todo-App synchronisiert werden.

## Datenfluss

```
Planka → n8n → Todo-App Caritas
```

1. **Planka** sendet Webhook-Events bei Card-Änderungen
2. **n8n** verarbeitet die Events und leitet sie weiter
3. **Todo-App** empfängt die Events und erstellt/aktualisiert Tasks

## Unterstützte Events

### cardUpdate
Wird ausgelöst, wenn eine Karte in Planka aktualisiert wird (z.B. Status-Änderung, Prioritäts-Änderung).

**Beispiel-Datenstruktur:**
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

## Status-Mapping

Die Planka-Listen werden zu Todo-App-Status gemappt:

| Planka Liste | Todo-App Status | Priorität |
|--------------|-----------------|-----------|
| Priorität 1  | in_bearbeitung  | hoch      |
| Priorität 2  | offen           | mittel    |
| Priorität 3  | offen           | niedrig   |
| Erledigt     | erledigt        | mittel    |

## Konfiguration

### Umgebungsvariablen

```bash
# Token für eingehende Webhooks von n8n
INBOUND_WEBHOOK_TOKEN="caritas-webhook-token-2024"

# Mapping von Planka-Listen zu App-Status
PLANKA_LIST_TO_STATUS='{"Priorität 1":"in_bearbeitung","Priorität 2":"offen","Priorität 3":"offen","Erledigt":"erledigt"}'
```

### n8n Webhook-Konfiguration

**Webhook URL:** `https://your-app.vercel.app/api/webhooks/n8n`

**Headers:**
- `Content-Type: application/json`
- `X-Webhook-Token: caritas-webhook-token-2024`

## Testing

### Test-Script ausführen

```bash
# Lokaler Test
node test-planka-webhook.js

# Mit Umgebungsvariablen
WEBHOOK_URL="http://localhost:3000/api/webhooks/n8n" \
INBOUND_WEBHOOK_TOKEN="caritas-webhook-token-2024" \
node test-planka-webhook.js
```

### Manueller Test

```bash
curl -X POST https://your-app.vercel.app/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: caritas-webhook-token-2024" \
  -d @test-data.json
```

## Logging

Die Webhook-Verarbeitung wird detailliert geloggt:

```
Webhook: Verarbeite cardUpdate - Card: Heizung Reparatur, Liste: Priorität 2, Status: offen, Priorität: mittel
Webhook: Card Details - ID: 1614531618771305515, Deadline: 2025-10-13T10:00:00.000Z, Beschreibung: Heizung Tropft
Webhook: Task aktualisiert - ID: task-id, Status: offen, Priorität: mittel
```

## Fehlerbehandlung

- **401 Unauthorized:** Ungültiger oder fehlender Webhook-Token
- **404 Not Found:** Benutzer nicht in der Datenbank gefunden
- **400 Bad Request:** Ungültige Payload-Struktur oder unbekanntes Event
- **500 Internal Server Error:** Datenbankfehler oder andere Serverfehler

## Sicherheit

- Alle Webhook-Anfragen müssen einen gültigen Token enthalten
- Benutzer werden über E-Mail-Adresse identifiziert
- Nur autorisierte Benutzer können Tasks erstellen/aktualisieren

## Troubleshooting

### Häufige Probleme

1. **"Benutzer nicht gefunden"**
   - Prüfen Sie, ob der Benutzer in der Datenbank registriert ist
   - E-Mail-Adresse muss exakt übereinstimmen

2. **"Task nicht gefunden"**
   - Task existiert noch nicht (wird bei cardCreate erstellt)
   - External ID stimmt nicht überein

3. **"Ungültiger Token"**
   - Prüfen Sie die INBOUND_WEBHOOK_TOKEN Umgebungsvariable
   - Token muss in n8n und App identisch sein

### Debug-Modus

Aktivieren Sie detailliertes Logging durch Setzen von:
```bash
NODE_ENV=development
```

## Erweiterte Konfiguration

### Custom Status-Mapping

Passen Sie das Status-Mapping in der Umgebungsvariable an:

```bash
PLANKA_LIST_TO_STATUS='{"Meine Liste":"custom_status","Andere Liste":"anderer_status"}'
```

### Prioritäts-Mapping

Die Priorität wird automatisch aus dem Listen-Namen abgeleitet:
- Enthält "Priorität 1" → hoch
- Enthält "Priorität 2" → mittel  
- Enthält "Priorität 3" → niedrig
- Sonst → mittel
