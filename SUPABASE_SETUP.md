# Supabase-Datenbankeinrichtung

## 🚀 Schnellstart

### 1. Supabase-Projekt erstellen
1. Gehen Sie zu [supabase.com](https://supabase.com)
2. Erstellen Sie ein neues Projekt
3. Notieren Sie sich die Projekt-URL und das Datenbankpasswort

### 2. Environment Variables in Vercel setzen
Setzen Sie diese Variablen in Ihrem Vercel-Projekt:

```bash
SUPABASE_URL=https://ihr-projekt-ref.supabase.co
SUPABASE_ANON_KEY=ihr-anon-key
SUPABASE_SERVICE_ROLE_KEY=ihr-service-role-key
SUPABASE_DB_PASSWORD=ihr-datenbank-passwort
NEXTAUTH_SECRET=generieren-sie-einen-sicheren-schlüssel
NEXTAUTH_URL=https://ihr-app-name.vercel.app
```

### 3. Datenbankstruktur einrichten

#### Option A: Automatisch (empfohlen)
```bash
npm run setup-db
```

#### Option B: Manuell über Supabase Dashboard
1. Gehen Sie zu Ihrem Supabase-Projekt
2. Öffnen Sie den SQL Editor
3. Führen Sie das folgende SQL aus:

```sql
-- Users-Tabelle
CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

-- Tasks-Tabelle
CREATE TABLE "tasks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'mittel',
  "status" TEXT NOT NULL DEFAULT 'offen',
  "deadline" TIMESTAMP(3),
  "comment" TEXT,
  "external_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "user_id" TEXT NOT NULL,
  CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index für eindeutige E-Mail-Adressen
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

## 📊 Datenbankstruktur

### Users-Tabelle
- `id`: Eindeutige Benutzer-ID (CUID)
- `email`: E-Mail-Adresse (eindeutig)
- `password`: Gehashtes Passwort (bcrypt)
- `name`: Optionaler Name
- `created_at`: Erstellungsdatum
- `updated_at`: Letztes Update

### Tasks-Tabelle
- `id`: Eindeutige Aufgaben-ID (CUID)
- `title`: Aufgaben-Titel
- `description`: Optionale Beschreibung
- `priority`: Priorität (niedrig, mittel, hoch, dringend)
- `status`: Status (offen, in_bearbeitung, erledigt)
- `deadline`: Optionales Fälligkeitsdatum
- `comment`: Optionaler Kommentar
- `external_id`: Externe ID (z.B. für Planka-Integration)
- `user_id`: Verknüpfung zum Benutzer
- `created_at`: Erstellungsdatum
- `updated_at`: Letztes Update

## 🔧 Troubleshooting

### Verbindungsprobleme
- Überprüfen Sie die DATABASE_URL in Vercel
- Stellen Sie sicher, dass die Supabase-Keys korrekt sind
- Prüfen Sie die Netzwerk-Zugriffsregeln in Supabase

### Migration-Probleme
- Führen Sie `npm run setup-db` aus
- Überprüfen Sie die Supabase-Logs
- Stellen Sie sicher, dass die Tabellen nicht bereits existieren

## 📝 Nützliche Befehle

```bash
# Datenbankstruktur einrichten
npm run setup-db

# Datenbank-URL generieren
npm run generate-db-url

# Prisma Client neu generieren
npx prisma generate

# Datenbank-Status prüfen
npx prisma db pull
```

## 🎯 Nächste Schritte

Nach der Einrichtung können Sie:
1. Benutzer registrieren
2. Aufgaben erstellen
3. Die App lokal testen
4. Auf Vercel deployen
