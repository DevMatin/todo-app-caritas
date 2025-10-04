# Todo App Caritas

Eine moderne Aufgabenverwaltung für Handwerker-Teams, entwickelt mit Next.js, Prisma und PostgreSQL.

## Features

- 🔐 Benutzerauthentifizierung mit NextAuth (Credentials)
- 📝 Aufgabenverwaltung mit Prioritäten und Status
- 📅 Fälligkeitsdaten und Kommentare
- 🎨 Moderne UI mit Tailwind CSS
- 🔗 n8n Webhook-Integration für bidirektionale Synchronisation
- 🐳 Docker-Containerisierung für einfaches Deployment
- 🚀 Portainer-kompatibel

## Lokale Entwicklung

### Voraussetzungen

- Node.js 18+
- PostgreSQL 16+
- npm oder yarn

### Setup

1. Repository klonen:
```bash
git clone <repository-url>
cd todo-app-caritas
```

2. Dependencies installieren:
```bash
npm install
```

3. Environment-Variablen konfigurieren:
```bash
cp .env.example .env
```

Bearbeite `.env` und setze deine Werte:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo?schema=public"
NEXTAUTH_URL="http://localhost:3003"
NEXTAUTH_SECRET="dein-geheimer-schlüssel"

# n8n Webhook-Konfiguration (optional)
INBOUND_WEBHOOK_TOKEN="dein-webhook-token"
PLANKA_LIST_TO_STATUS='{"Offen":"offen","In Bearbeitung":"in_bearbeitung","Erledigt":"erledigt"}'
N8N_OUTBOUND_WEBHOOK_URL="https://dein-n8n-instanz.com/webhook/todo-app"
N8N_OUTBOUND_TOKEN="dein-n8n-token"
```

4. Datenbank migrieren:
```bash
npx prisma migrate dev
```

5. Entwicklungsserver starten:
```bash
npm run dev
```

Die App ist dann unter `http://localhost:3003` erreichbar.

## Docker Deployment

### Mit Docker Compose

1. Environment-Variablen setzen:
```bash
export NEXTAUTH_SECRET="dein-geheimer-schlüssel"
```

2. Container starten:
```bash
docker compose up -d --build
```

Die App ist dann unter `http://localhost:3003` erreichbar.

### Mit Portainer

1. Erstelle einen neuen Stack in Portainer
2. Kopiere den Inhalt von `docker-compose.yml`
3. Setze die Environment-Variablen:
   - `NEXTAUTH_SECRET`: Ein sicherer Schlüssel (z.B. generiert mit `openssl rand -base64 32`)
4. Deploye den Stack
5. Die App ist über Port 3003 erreichbar

## Erste Schritte

1. Öffne die App im Browser
2. Registriere einen neuen Benutzer über `/register`
3. Melde dich mit deinen Anmeldedaten an
4. Erstelle deine erste Aufgabe

## Technologie-Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Datenbank**: PostgreSQL mit Prisma ORM
- **Authentifizierung**: NextAuth.js
- **Containerisierung**: Docker, Docker Compose
- **Deployment**: Portainer-kompatibel

## API Endpoints

### Aufgabenverwaltung
- `GET /api/tasks` - Alle Aufgaben des Benutzers abrufen
- `POST /api/tasks` - Neue Aufgabe erstellen
- `GET /api/tasks/[id]` - Einzelne Aufgabe abrufen
- `PUT /api/tasks/[id]` - Aufgabe aktualisieren
- `DELETE /api/tasks/[id]` - Aufgabe löschen

### Authentifizierung
- `POST /api/register` - Neuen Benutzer registrieren
- `POST /api/auth/signin` - Benutzer anmelden

### Webhooks
- `POST /api/webhooks/n8n` - Eingehender Webhook von n8n (mit Token-Authentifizierung)

## Datenmodell

### User
- `id`: Eindeutige ID
- `email`: E-Mail-Adresse (unique)
- `password`: Gehashtes Passwort
- `name`: Optionaler Name
- `createdAt`, `updatedAt`: Zeitstempel

### Task
- `id`: Eindeutige ID
- `title`: Titel der Aufgabe
- `description`: Optionale Beschreibung
- `priority`: Priorität (niedrig, mittel, hoch, dringend)
- `status`: Status (offen, in_bearbeitung, erledigt)
- `deadline`: Optionales Fälligkeitsdatum
- `comment`: Optionaler Kommentar
- `userId`: Referenz zum Benutzer
- `createdAt`, `updatedAt`: Zeitstempel

## n8n Webhook-Integration

### Eingehende Webhooks (Planka → n8n → App)

Die App empfängt Webhooks von n8n, die von Planka-Kanban-Boards stammen:

**Endpunkt**: `POST /api/webhooks/n8n`
**Authentifizierung**: Header `X-Webhook-Token` muss mit `INBOUND_WEBHOOK_TOKEN` übereinstimmen

**Payload-Format**:
```json
{
  "source": "planka",
  "event": "cardCreate|cardUpdate|cardDelete",
  "userEmail": "user@example.org",
  "card": {
    "id": "<planka-card-id>",
    "title": "Aufgabentitel",
    "description": "Beschreibung",
    "listName": "Offen|In Bearbeitung|Erledigt",
    "labels": ["hoch"],
    "dueDate": "2025-10-05T12:00:00.000Z"
  }
}
```

**Status-Mapping**: Planka Listen-Namen werden über `PLANKA_LIST_TO_STATUS` auf App-Status gemappt:
- "Offen" → "offen"
- "In Bearbeitung" → "in_bearbeitung" 
- "Erledigt" → "erledigt"

**Priorität**: Erstes Label wird als Priorität verwendet, Fallback ist "mittel"

### Ausgehende Events (App → n8n)

Bei jeder Aufgabenänderung sendet die App Events an n8n:

**Events**:
- `taskCreate` - Neue Aufgabe erstellt
- `taskUpdate` - Aufgabe aktualisiert (mit geänderten Feldern)
- `taskStatusChange` - Status geändert (zusätzlich zu taskUpdate)
- `taskDelete` - Aufgabe gelöscht

**Payload-Format**:
```json
{
  "event": "taskCreate|taskUpdate|taskDelete|taskStatusChange",
  "task": {
    "id": "task-id",
    "title": "Titel",
    "description": "Beschreibung",
    "priority": "hoch",
    "status": "in_bearbeitung",
    "deadline": "2025-10-05T12:00:00.000Z",
    "userEmail": "user@example.org"
  },
  "meta": {
    "changedFields": ["status", "title"],
    "previous": {"status": "offen"},
    "timestamp": "2025-01-04T10:30:00.000Z"
  }
}
```

### n8n Workflow-Beispiel

1. **Planka Webhook Node**: Events `cardCreate`, `cardUpdate`, `cardDelete` empfangen
2. **Transform Node**: 
   - `listName` → Status mappen
   - Labels → Priorität extrahieren
   - `userEmail` aus Planka-Benutzerdaten setzen
3. **HTTP Request Node**: 
   - URL: `https://deine-app.com/api/webhooks/n8n`
   - Header: `X-Webhook-Token: dein-token`
   - Payload wie oben

### Environment-Variablen

```bash
# Eingehende Webhooks
INBOUND_WEBHOOK_TOKEN="sicherer-token-für-eingehende-webhooks"

# Status-Mapping (optional, Standard-Werte werden verwendet)
PLANKA_LIST_TO_STATUS='{"Offen":"offen","In Bearbeitung":"in_bearbeitung","Erledigt":"erledigt"}'

# Ausgehende Events
N8N_OUTBOUND_WEBHOOK_URL="https://deine-n8n-instanz.com/webhook/todo-app"
N8N_OUTBOUND_TOKEN="n8n-webhook-token"
```

## Sicherheit

- Passwörter werden mit bcrypt gehasht
- JWT-basierte Sessions
- Middleware-Schutz für alle Routen außer Login/Register
- Benutzer-spezifische Datenabfragen
- Webhook-Token-Authentifizierung für eingehende Events

## Support

Bei Fragen oder Problemen erstelle ein Issue im Repository.