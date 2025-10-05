# Prioritätsänderungen zwischen Planka und Todo-App

## Problem
Wenn eine Aufgabe in Planka von einer Prioritätsliste zu einer anderen verschoben wird (z.B. von "Priorität 2" zu "Priorität 1"), sollte sich das auch in der Todo-App entsprechend aktualisieren.

## Lösung
Das Webhook-System wurde erweitert, um beide Event-Typen von Planka zu verarbeiten:

### 1. actionCreate Events (moveCard)
- **Wann**: Wenn eine Karte zwischen Listen verschoben wird
- **Daten**: Enthält `fromList` und `toList` Informationen
- **Verarbeitung**: Nur Priorität und Status werden aktualisiert

### 2. cardUpdate Events
- **Wann**: Wenn eine Karte allgemein aktualisiert wird
- **Daten**: Enthält vollständige Card-Informationen
- **Verarbeitung**: Alle Felder werden aktualisiert

## Implementierte Änderungen

### Webhook-Handler (`app/api/webhooks/n8n/route.ts`)

```typescript
// Verschiedene Event-Typen handhaben
if (body.event === 'actionCreate' && body.data?.item?.type === 'moveCard') {
  // Für actionCreate Events (moveCard)
  const actionData = body.data.item.data
  card = {
    id: body.data.cardId,
    name: actionData.card.name,
    description: '', // Nicht in actionCreate verfügbar
    dueDate: null,   // Nicht in actionCreate verfügbar
    listId: actionData.toList.id
  }
  included = body.data.included
  listName = actionData.toList.name
} else {
  // Für cardUpdate Events (Standard)
  card = body.data?.item
  included = body.data?.included
  // ... Standard-Verarbeitung
}
```

### Intelligente Task-Aktualisierung

```typescript
// Bei actionCreate Events nur Priorität und Status aktualisieren
// Bei cardUpdate Events alle Felder aktualisieren
const updateData: any = {
  status: status,
  priority: priority,
  label: priorityLabel
}

if (body.event === 'cardUpdate') {
  // Vollständige Aktualisierung bei cardUpdate
  updateData.title = card?.name
  updateData.description = card?.description
  updateData.deadline = deadline
  updateData.externalId = card?.id
}
```

## Prioritäts-Mapping

| Planka Liste | Todo-App Priorität | Todo-App Status | Todo-App Label |
|--------------|-------------------|-----------------|----------------|
| Priorität 1  | Priorität 1       | in_bearbeitung  | hoch           |
| Priorität 2  | Priorität 2       | offen           | mittel         |
| Priorität 3  | Priorität 3       | offen           | niedrig        |
| Erledigt     | Priorität 2       | erledigt        | mittel         |

## Test-Szenarien

### Test 1: actionCreate Event
- **Szenario**: Card "Heizung Reparatur" wird von "Priorität 2" zu "Priorität 1" verschoben
- **Erwartetes Ergebnis**: 
  - Priorität: "Priorität 1"
  - Status: "in_bearbeitung"
  - Label: "hoch"

### Test 2: cardUpdate Event
- **Szenario**: Card "Heizung Reparatur" wird von "Priorität 1" zu "Priorität 3" verschoben
- **Erwartetes Ergebnis**:
  - Priorität: "Priorität 3"
  - Status: "offen"
  - Label: "niedrig"

## Test ausführen

```bash
# Test-Script ausführen
node test-priority-webhook.js
```

## Logging-Verbesserungen

Das System loggt jetzt detaillierte Informationen über:
- Event-Typ und Card-Name
- Listen-Änderungen (von/zu)
- Prioritäts- und Status-Updates
- Datenbank-Operationen

## Kompatibilität

- ✅ Rückwärtskompatibel mit bestehenden `cardUpdate` Events
- ✅ Neue Unterstützung für `actionCreate` Events
- ✅ Intelligente Datenverarbeitung je nach Event-Typ
- ✅ Robuste Fehlerbehandlung
