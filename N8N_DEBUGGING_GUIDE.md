# 🔍 Debugging: n8n Webhook funktioniert nicht

## ✅ Was funktioniert
- Lokale Tests funktionieren perfekt
- Alle Datenformate werden korrekt verarbeitet
- Supabase-Verbindung ist stabil

## 🔍 Problem identifiziert
**n8n sendet andere Daten als erwartet** - das ist der häufigste Grund für Webhook-Probleme.

## 🧪 Debugging-Schritte

### Schritt 1: Server-Logs aktivieren
```bash
npm run dev
```

### Schritt 2: n8n Webhook testen
Senden Sie einen Test von n8n und schauen Sie die Server-Logs für:

```
Webhook: VOLLSTÄNDIGE n8n-DATEN: {...}
Webhook: Body-Keys: [...]
Webhook: Hat body.card? true/false
Webhook: Hat body.data? true/false
Webhook: Hat body.user? true/false
Webhook: Event-Typ: ...
```

### Schritt 3: Datenstruktur analysieren
Vergleichen Sie die n8n-Daten mit den erwarteten Formaten:

**Erwartetes Format 1 (direkte n8n-Daten):**
```json
{
  "card": {
    "id": "1614531618771305515",
    "name": "Heizung Reparatur",
    "listName": "Priorität 1"
  },
  "user": {
    "email": "faal@caritas-erlangen.de"
  }
}
```

**Erwartetes Format 2 (Planka cardUpdate):**
```json
{
  "event": "cardUpdate",
  "data": {
    "item": {
      "id": "1614531618771305515",
      "name": "Heizung Reparatur",
      "listId": "list-prio1"
    },
    "included": {
      "lists": [{"id": "list-prio1", "name": "Priorität 1"}]
    }
  },
  "user": {
    "email": "faal@caritas-erlangen.de"
  }
}
```

## 🔧 Häufige Lösungen

### Lösung 1: n8n-Konfiguration überprüfen
- Überprüfen Sie die n8n Webhook-Konfiguration
- Stellen Sie sicher, dass die richtigen Daten gesendet werden
- Prüfen Sie die Liste-Namen in n8n

### Lösung 2: Webhook-Logik anpassen
Falls n8n andere Daten sendet, passen Sie die Logik an:

```typescript
// In app/api/webhooks/n8n/route.ts
// Fügen Sie neue Datenformate hinzu:

if (body.card && body.user) {
  // Direkte n8n-Daten
} else if (body.event === 'cardUpdate') {
  // Planka cardUpdate
} else if (body.event === 'actionCreate') {
  // Planka actionCreate
} else if (body.ihrN8nFormat) {
  // Ihr spezifisches n8n-Format
  card = body.ihrN8nFormat.card
  listName = body.ihrN8nFormat.listName
}
```

### Lösung 3: Webhook-Token überprüfen
```bash
# Überprüfen Sie das Token
grep INBOUND_WEBHOOK_TOKEN .env.local
```

## 📋 Checkliste

- [ ] Server läuft (`npm run dev`)
- [ ] Webhook-Token ist korrekt gesetzt
- [ ] n8n sendet die erwarteten Daten
- [ ] Server-Logs zeigen die vollständigen n8n-Daten
- [ ] Datenstruktur stimmt mit der Webhook-Logik überein
- [ ] Liste-Namen sind korrekt

## 🚀 Nächste Schritte

1. **Starten Sie den Server** und schauen Sie die Logs
2. **Senden Sie einen Test von n8n**
3. **Analysieren Sie die n8n-Daten** in den Logs
4. **Passen Sie die Webhook-Logik an** falls nötig
5. **Testen Sie erneut** mit den korrigierten Einstellungen

## 💡 Tipp
Die Server-Logs zeigen Ihnen **genau**, welche Daten n8n sendet. Vergleichen Sie diese mit den erwarteten Formaten und passen Sie die Webhook-Logik entsprechend an.
