# Todo App Caritas

Eine moderne Aufgabenverwaltung für Handwerker-Teams, entwickelt mit Next.js, Prisma und PostgreSQL.

## Features

- 🔐 Benutzerauthentifizierung mit NextAuth (Credentials)
- 📝 Aufgabenverwaltung mit Prioritäten und Status
- 📅 Fälligkeitsdaten und Kommentare
- 🎨 Moderne UI mit Tailwind CSS
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

- `GET /api/tasks` - Alle Aufgaben des Benutzers abrufen
- `POST /api/tasks` - Neue Aufgabe erstellen
- `GET /api/tasks/[id]` - Einzelne Aufgabe abrufen
- `PUT /api/tasks/[id]` - Aufgabe aktualisieren
- `DELETE /api/tasks/[id]` - Aufgabe löschen
- `POST /api/register` - Neuen Benutzer registrieren
- `POST /api/auth/signin` - Benutzer anmelden

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

## Sicherheit

- Passwörter werden mit bcrypt gehasht
- JWT-basierte Sessions
- Middleware-Schutz für alle Routen außer Login/Register
- Benutzer-spezifische Datenabfragen

## Support

Bei Fragen oder Problemen erstelle ein Issue im Repository.