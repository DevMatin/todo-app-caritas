# 🚀 Vercel Deployment Guide - Todo App Caritas

Diese Anleitung führt Sie Schritt für Schritt durch das Deployment Ihrer Next.js Todo-App auf Vercel mit Supabase als Datenbank.

## 📋 Voraussetzungen

- GitHub-Account
- Vercel-Account (kostenlos bei [vercel.com](https://vercel.com))
- Supabase-Account (kostenlos bei [supabase.com](https://supabase.com))
- Ihr Code ist in einem GitHub-Repository

## 🗄️ Schritt 1: Supabase-Projekt erstellen

### 1.1 Supabase-Projekt anlegen
1. Gehen Sie zu [supabase.com](https://supabase.com) und melden Sie sich an
2. Klicken Sie auf **"New Project"**
3. Wählen Sie Ihre Organisation
4. Geben Sie einen Projektnamen ein (z.B. `todo-app-caritas`)
5. Generieren Sie ein sicheres Passwort für die Datenbank
6. Wählen Sie eine Region (z.B. `Frankfurt` für Deutschland)
7. Klicken Sie auf **"Create new project"**

### 1.2 Datenbank-URL kopieren
1. Warten Sie, bis das Projekt erstellt ist (ca. 2-3 Minuten)
2. Gehen Sie zu **Settings** → **Database**
3. Scrollen Sie zu **"Connection string"**
4. Kopieren Sie die **URI** (beginnt mit `postgresql://`)
5. **Wichtig**: Ersetzen Sie `[YOUR-PASSWORD]` mit dem Passwort, das Sie bei der Erstellung gewählt haben

**Beispiel:**
```
postgresql://postgres:ihr-passwort@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## 🔐 Schritt 2: NEXTAUTH_SECRET generieren

Generieren Sie einen sicheren Schlüssel für die Authentifizierung:

**Windows (PowerShell):**
```powershell
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Online-Generator:**
Besuchen Sie [generate-secret.vercel.app](https://generate-secret.vercel.app/32) und kopieren Sie den generierten Schlüssel.

## 🌐 Schritt 3: Vercel-Projekt erstellen

### 3.1 Repository mit Vercel verknüpfen
1. Gehen Sie zu [vercel.com](https://vercel.com) und melden Sie sich an
2. Klicken Sie auf **"New Project"**
3. Wählen Sie **"Import Git Repository"**
4. Wählen Sie Ihr GitHub-Repository aus
5. Klicken Sie auf **"Import"**

### 3.2 Projekt-Konfiguration
1. **Project Name**: Geben Sie einen Namen ein (z.B. `todo-app-caritas`)
2. **Framework Preset**: Sollte automatisch auf **"Next.js"** erkannt werden
3. **Root Directory**: Lassen Sie das Feld leer (Standard)
4. **Build and Output Settings**: Lassen Sie die Standardwerte

## ⚙️ Schritt 4: Environment Variables setzen

### 4.1 In Vercel Dashboard
1. Gehen Sie zu Ihrem Projekt-Dashboard
2. Klicken Sie auf **"Settings"**
3. Wählen Sie **"Environment Variables"**
4. Fügen Sie folgende Variablen hinzu:

| Name | Value | Beschreibung |
|------|-------|--------------|
| `DATABASE_URL` | `postgresql://postgres:ihr-passwort@db.abcdefghijklmnop.supabase.co:5432/postgres` | Supabase Connection String |
| `NEXTAUTH_SECRET` | `ihr-generierter-secret-key` | Generierter Authentifizierungs-Schlüssel |
| `NEXTAUTH_URL` | `https://ihr-projekt-name.vercel.app` | Ihre Vercel-URL (wird automatisch gesetzt) |

### 4.2 Optional: Webhook-Variablen
Falls Sie n8n-Integration nutzen möchten:

| Name | Value | Beschreibung |
|------|-------|--------------|
| `INBOUND_WEBHOOK_TOKEN` | `ihr-webhook-token` | Token für eingehende Webhooks |
| `N8N_OUTBOUND_WEBHOOK_URL` | `https://ihr-n8n-instanz.com/webhook/todo-app` | n8n Webhook-URL |
| `N8N_OUTBOUND_TOKEN` | `ihr-n8n-token` | Token für ausgehende Webhooks |

## 🚀 Schritt 5: Deployment durchführen

### 5.1 Automatisches Deployment
1. Klicken Sie auf **"Deploy"** in Vercel
2. Warten Sie, bis der Build-Prozess abgeschlossen ist (ca. 2-3 Minuten)
3. Ihre App ist jetzt live unter `https://ihr-projekt-name.vercel.app`

### 5.2 Build-Prozess überwachen
Der Build-Prozess führt automatisch folgende Schritte aus:
1. `npm install` - Dependencies installieren
2. `prisma generate` - Prisma Client generieren
3. `prisma migrate deploy` - Datenbank-Migrationen ausführen
4. `next build` - Next.js App bauen

## 🗃️ Schritt 6: Datenbank initialisieren

### 6.1 Prisma Studio (Optional)
Falls Sie die Datenbank visuell verwalten möchten:
1. Installieren Sie Vercel CLI: `npm i -g vercel`
2. Führen Sie aus: `vercel env pull .env.local`
3. Führen Sie aus: `npx prisma studio`

### 6.2 Erste Benutzer registrieren
1. Öffnen Sie Ihre App: `https://ihr-projekt-name.vercel.app`
2. Gehen Sie zu `/register`
3. Registrieren Sie Ihren ersten Benutzer
4. Melden Sie sich an und erstellen Sie Ihre erste Aufgabe

## 🔄 Schritt 7: Automatische Deployments einrichten

### 7.1 GitHub Integration
- Jeder Push in den `main` Branch löst automatisch ein neues Deployment aus
- Pull Requests erstellen automatisch Preview-Deployments

### 7.2 Custom Domain (Optional)
1. Gehen Sie zu **Settings** → **Domains**
2. Fügen Sie Ihre Domain hinzu
3. Folgen Sie den DNS-Anweisungen

## 🛠️ Troubleshooting

### Build-Fehler beheben

**Problem**: `Prisma Client not generated`
**Lösung**: Stellen Sie sicher, dass `postinstall` Script in `package.json` vorhanden ist

**Problem**: `Database connection failed`
**Lösung**: Überprüfen Sie die `DATABASE_URL` in Vercel Environment Variables

**Problem**: `NEXTAUTH_SECRET missing`
**Lösung**: Generieren Sie einen neuen Secret und setzen Sie ihn in Vercel

### Logs überprüfen
1. Gehen Sie zu Ihrem Vercel-Dashboard
2. Wählen Sie **"Functions"** oder **"Deployments"**
3. Klicken Sie auf die neueste Deployment
4. Überprüfen Sie die Build-Logs

## 📊 Monitoring und Analytics

### Vercel Analytics
1. Gehen Sie zu **Settings** → **Analytics**
2. Aktivieren Sie Vercel Analytics für detaillierte Insights

### Supabase Dashboard
1. Überwachen Sie Ihre Datenbank-Performance in Supabase
2. Überprüfen Sie API-Usage und Limits

## 🔒 Sicherheit

### Environment Variables
- **Niemals** committen Sie `.env` Dateien
- Verwenden Sie starke Passwörter für die Datenbank
- Rotieren Sie regelmäßig Ihre Secrets

### Datenbank-Sicherheit
- Aktivieren Sie Row Level Security (RLS) in Supabase falls nötig
- Überwachen Sie ungewöhnliche Aktivitäten

## 📈 Skalierung

### Vercel Limits
- **Hobby Plan**: 100GB Bandwidth/Monat, unbegrenzte Deployments
- **Pro Plan**: Erweiterte Features für Teams

### Supabase Limits
- **Free Tier**: 500MB Datenbank, 2GB Bandwidth
- **Pro Plan**: Erweiterte Limits und Features

## 🆘 Support

Bei Problemen:
1. Überprüfen Sie die Vercel-Dokumentation
2. Schauen Sie in die Supabase-Dokumentation
3. Erstellen Sie ein Issue im GitHub-Repository

---

**🎉 Herzlichen Glückwunsch!** Ihre Todo-App ist jetzt live auf Vercel mit Supabase als Datenbank!
