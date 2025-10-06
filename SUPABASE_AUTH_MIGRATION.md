# Supabase Auth Migration - Setup Guide

## ✅ Migration erfolgreich abgeschlossen!

Die Todo App wurde erfolgreich von **NextAuth.js** zu **Supabase Authentication** migriert.

## Was wurde geändert

### 🔄 Authentifizierung
- **Vorher:** NextAuth.js mit Credentials Provider + bcrypt
- **Jetzt:** Supabase Auth mit nativer Email/Passwort-Verwaltung

### 🗄️ Datenbank
- **User-Tabelle:** `password` Feld entfernt, `id` wird als Supabase Auth UUID verwendet
- **RLS (Row Level Security):** Aktiviert für automatische Benutzer-Isolation
- **Auto-Sync:** Neue Supabase Auth User werden automatisch in der Prisma DB erstellt

### 🎨 Neue Features
- **Account-Einstellungen:** `/settings` - Profil bearbeiten, Passwort ändern
- **Passwort zurücksetzen:** `/forgot-password` und `/reset-password`
- **Verbesserte UX:** Bessere Fehlermeldungen, automatische Weiterleitungen

## 🚀 Setup-Anleitung

### 1. Supabase Projekt konfigurieren

#### A. Authentication Settings
1. Gehen Sie zu Ihrem Supabase Dashboard → **Authentication** → **Settings**
2. **Email Provider** aktivieren (falls noch nicht aktiv)
3. **Site URL** setzen:
   - Entwicklung: `http://localhost:3000`
   - Produktion: `https://ihre-domain.com`
4. **Redirect URLs** hinzufügen:
   - `http://localhost:3000/api/auth/callback`
   - `https://ihre-domain.com/api/auth/callback`

#### B. Email Templates (optional)
1. Gehen Sie zu **Authentication** → **Email Templates**
2. Templates auf Deutsch anpassen:
   - **Confirm Signup**
   - **Reset Password**

### 2. Environment Variables

Kopieren Sie `env.example` zu `.env.local` und setzen Sie:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://ihr-projekt-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ihr-anon-key"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ihr-service-role-key"
DATABASE_URL="postgresql://postgres:ihr-passwort@db.ihr-projekt-ref.supabase.co:5432/postgres"
```

**Wo finden Sie diese Werte:**
- **NEXT_PUBLIC_SUPABASE_URL:** Settings → API → Project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY:** Settings → API → anon public
- **SUPABASE_SERVICE_ROLE_KEY:** Settings → API → service_role secret
- **DATABASE_URL:** Settings → Database → Connection string

### 3. Datenbank Migration

Führen Sie das Migrations-Script aus:

```bash
# Verbinden Sie sich mit Ihrer Supabase Datenbank
psql "postgresql://postgres:ihr-passwort@db.ihr-projekt-ref.supabase.co:5432/postgres"

# Führen Sie das Migrations-Script aus
\i scripts/migrate-to-supabase-auth.sql
```

**Was das Script macht:**
- Entfernt das `password` Feld aus der `users` Tabelle
- Konvertiert `id` Spalten zu UUID (falls nötig)
- Aktiviert Row Level Security (RLS)
- Erstellt RLS Policies für Benutzer-Isolation
- Erstellt Trigger für automatische User-Synchronisation

### 4. Prisma Client aktualisieren

```bash
npm run postinstall
# oder
npx prisma generate
```

### 5. App starten

```bash
npm run dev
```

## 🧪 Testen der Migration

### 1. Registrierung testen
1. Gehen Sie zu `http://localhost:3000/register`
2. Erstellen Sie einen neuen Account
3. Prüfen Sie ob der User in Supabase Auth und der Prisma DB erstellt wurde

### 2. Login testen
1. Gehen Sie zu `http://localhost:3000/login`
2. Melden Sie sich mit den neuen Credentials an
3. Prüfen Sie ob Sie zur Hauptseite weitergeleitet werden

### 3. Account-Einstellungen testen
1. Gehen Sie zu `http://localhost:3000/settings`
2. Testen Sie Profil bearbeiten
3. Testen Sie Passwort ändern

### 4. Passwort zurücksetzen testen
1. Gehen Sie zu `http://localhost:3000/forgot-password`
2. Geben Sie Ihre E-Mail ein
3. Prüfen Sie Ihre E-Mails auf den Reset-Link

## 🔧 Wichtige Dateien

### Neue Dateien
- `lib/supabase-client.ts` - Client-seitiger Supabase Client
- `lib/supabase-server.ts` - Server-seitiger Supabase Client
- `lib/auth-helpers.ts` - Auth Helper Funktionen
- `app/settings/page.tsx` - Account-Einstellungen
- `app/forgot-password/page.tsx` - Passwort vergessen
- `app/reset-password/page.tsx` - Passwort zurücksetzen
- `app/api/auth/callback/route.ts` - Supabase Auth Callback
- `app/api/auth/signout/route.ts` - Logout Handler
- `scripts/migrate-to-supabase-auth.sql` - Datenbank Migration

### Geänderte Dateien
- `app/login/page.tsx` - Supabase Auth Login
- `app/register/page.tsx` - Supabase Auth Registrierung
- `app/page.tsx` - Supabase Auth Session Check
- `app/api/tasks/route.ts` - Supabase Auth in API Routes
- `app/api/tasks/[id]/route.ts` - Supabase Auth in API Routes
- `middleware.ts` - Supabase Auth Middleware
- `prisma/schema.prisma` - Entfernt password Feld
- `components/Providers.tsx` - Entfernt NextAuth SessionProvider

### Entfernte Dateien
- `app/api/auth/[...nextauth]/route.ts` - NextAuth Handler
- `app/api/register/route.ts` - Alte Registrierung API

## 🚨 Wichtige Hinweise

### Produktions-Deployment
1. **Environment Variables** in Vercel/Netlify setzen
2. **Site URL** in Supabase auf Ihre Produktions-Domain setzen
3. **Redirect URLs** in Supabase für Produktions-Domain konfigurieren

### Sicherheit
- **RLS ist aktiviert** - Benutzer können nur ihre eigenen Daten sehen
- **Automatische User-Synchronisation** - Neue Supabase Auth User werden automatisch in der DB erstellt
- **Session Management** - Supabase übernimmt automatische Token-Refresh

### Migration bestehender Benutzer
Falls Sie bestehende Benutzer haben:
1. **Backup** Ihrer aktuellen Datenbank erstellen
2. **Manuelle Migration** der Benutzer zu Supabase Auth (falls nötig)
3. **UUID-Mapping** zwischen alter und neuer User-ID

## 🎉 Vorteile der Migration

✅ **Keine eigene Passwort-Verwaltung** - Supabase übernimmt Sicherheit  
✅ **Built-in Features** - Email-Verifizierung, Passwort-Reset, etc.  
✅ **Skalierbarkeit** - Supabase Auth ist produktionsbereit  
✅ **Weniger Code** - Keine bcrypt, NextAuth Config, etc.  
✅ **Session Management** - Automatische Refresh Tokens  
✅ **Security Best Practices** - Von Supabase implementiert  
✅ **Row Level Security** - Automatische Daten-Isolation  

## 🆘 Troubleshooting

### Build-Fehler
```bash
# Falls Build-Fehler auftreten, prüfen Sie:
1. Environment Variables sind gesetzt
2. Prisma Client ist aktualisiert: npx prisma generate
3. Alle NextAuth Imports sind entfernt
```

### Login-Probleme
```bash
# Prüfen Sie:
1. Supabase Site URL ist korrekt gesetzt
2. Redirect URLs sind konfiguriert
3. Environment Variables sind korrekt
```

### Datenbank-Probleme
```bash
# Prüfen Sie:
1. Migration-Script wurde erfolgreich ausgeführt
2. RLS Policies sind aktiv
3. Foreign Key Constraints sind korrekt
```

## 📞 Support

Bei Problemen:
1. Prüfen Sie die Browser-Konsole auf Fehler
2. Prüfen Sie die Server-Logs
3. Prüfen Sie die Supabase Dashboard Logs
4. Stellen Sie sicher, dass alle Environment Variables gesetzt sind

---

**Migration erfolgreich abgeschlossen! 🎉**

Ihre Todo App verwendet jetzt Supabase Authentication mit allen modernen Features und verbesserter Sicherheit.
