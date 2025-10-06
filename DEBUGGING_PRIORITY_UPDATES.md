# 🔍 Debugging: Prioritäts-Updates funktionieren nicht

## ✅ Was funktioniert
- Supabase-Verbindung ist korrekt konfiguriert
- Prioritäts-Logik im Webhook funktioniert
- Datenbank-Updates sind möglich

## 🔍 Mögliche Ursachen

### 1. **n8n sendet falsche Daten**
Das häufigste Problem ist, dass n8n nicht die erwarteten Liste-Namen sendet.

**Überprüfung:**
```bash
# Schauen Sie in die Server-Logs beim Webhook-Aufruf
npm run dev
# Dann senden Sie einen Test von n8n und schauen Sie die Logs
```

**Erwartete Liste-Namen:**
- `Priorität 1` → Priorität 1, Status in_bearbeitung
- `Priorität 2` → Priorität 2, Status offen  
- `Priorität 3` → Priorität 3, Status offen

### 2. **Webhook-Token Problem**
```bash
# Überprüfen Sie das Token
grep INBOUND_WEBHOOK_TOKEN .env.local
```

### 3. **Event-Typ wird nicht erkannt**
Der Webhook verarbeitet verschiedene Event-Typen:
- `cardUpdate` (Standard)
- `actionCreate` mit `moveCard`
- `cardLabelCreate`

## 🧪 Test-Schritte

### Schritt 1: Server-Logs überprüfen
```bash
npm run dev
# Senden Sie einen Test von n8n
# Schauen Sie die Logs für:
# - "Webhook: VOLLSTÄNDIGE n8n-DATEN"
# - "Webhook: Liste-Name: [NAME]"
# - "Webhook: Neue Priorität: [PRIORITÄT]"
```

### Schritt 2: n8n-Daten analysieren
Schauen Sie sich die vollständigen n8n-Daten in den Logs an:
```json
{
  "event": "cardUpdate",
  "data": {
    "item": { "listId": "..." },
    "included": {
      "lists": [{ "id": "...", "name": "Priorität 1" }]
    }
  }
}
```

### Schritt 3: Liste-Namen vergleichen
Vergleichen Sie die Liste-Namen aus n8n mit den erwarteten Werten:
- ✅ `Priorität 1` → funktioniert
- ✅ `Priorität 2` → funktioniert  
- ✅ `Priorität 3` → funktioniert
- ❌ `Hoch` → wird zu `Priorität 1` gemappt
- ❌ `Niedrig` → wird zu `Priorität 3` gemappt

## 🔧 Häufige Lösungen

### Lösung 1: Liste-Namen in n8n korrigieren
Stellen Sie sicher, dass n8n die exakten Namen sendet:
- `Priorität 1`
- `Priorität 2` 
- `Priorität 3`

### Lösung 2: Webhook-Logik anpassen
Falls n8n andere Namen sendet, passen Sie die Logik an:

```typescript
// In app/api/webhooks/n8n/route.ts Zeile 74-79
let priority = 'Priorität 2' // Default
if (listName === 'Priorität 1') priority = 'Priorität 1'
else if (listName === 'Priorität 2') priority = 'Priorität 2'
else if (listName === 'Priorität 3') priority = 'Priorität 3'
// Fügen Sie hier Ihre n8n-Namen hinzu:
else if (listName === 'Ihr-n8n-Name-1') priority = 'Priorität 1'
else if (listName === 'Ihr-n8n-Name-2') priority = 'Priorität 2'
else if (listName === 'Ihr-n8n-Name-3') priority = 'Priorität 3'
```

### Lösung 3: Debugging aktivieren
Fügen Sie mehr Logging hinzu:

```typescript
console.log('Webhook: VOLLSTÄNDIGE n8n-DATEN:', JSON.stringify(body, null, 2))
console.log('Webhook: Liste-Name aus n8n:', listName)
console.log('Webhook: Abgeleitete Priorität:', priority)
```

## 📋 Checkliste

- [ ] Server läuft (`npm run dev`)
- [ ] Webhook-Token ist korrekt gesetzt
- [ ] n8n sendet die erwarteten Liste-Namen
- [ ] Server-Logs zeigen die vollständigen n8n-Daten
- [ ] Liste-Namen stimmen mit der Webhook-Logik überein
- [ ] Prioritäts-Updates werden in der Datenbank gespeichert

## 🚀 Nächste Schritte

1. **Starten Sie den Server** und schauen Sie die Logs
2. **Senden Sie einen Test von n8n** mit Priorität 1, 2 oder 3
3. **Analysieren Sie die Logs** für die Liste-Namen
4. **Passen Sie die Webhook-Logik an** falls nötig
5. **Testen Sie erneut** mit den korrigierten Einstellungen
