# Supabase-Sicherheit mit NextAuth.js

## ⚠️ **Wichtiger Sicherheitshinweis**

Ihre Supabase-Datenbank zeigt: **"Data is publicly accessible via API as RLS is disabled"**

Das bedeutet, dass alle Daten über die Supabase API öffentlich zugänglich sind!

## 🔒 **Sicherheitsoptionen**

### Option 1: RLS aktivieren (empfohlen für Supabase Auth)

```bash
npm run enable-rls
```

**Aber Achtung:** RLS funktioniert nur mit Supabase Auth, nicht mit NextAuth.js!

### Option 2: API-Schlüssel beschränken (empfohlen für NextAuth.js)

Da Sie NextAuth.js verwenden, sollten Sie:

1. **Service Role Key** nur für Server-seitige Operationen verwenden
2. **Anon Key** für Client-seitige Operationen verwenden
3. **API-Zugriff über Ihre App-Kontrollen** statt RLS

## 🛡️ **Sicherheitsstrategie für NextAuth.js**

### 1. API-Routen absichern

Alle Ihre API-Routen prüfen bereits die Session:

```typescript
// Beispiel aus /api/tasks/route.ts
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### 2. Datenbankabfragen absichern

```typescript
// Nur Tasks des angemeldeten Benutzers laden
const tasks = await prisma.task.findMany({
  where: { userId: session.user.id }
})
```

### 3. Supabase-Konfiguration

**Für Produktion:**
- Verwenden Sie nur den **Service Role Key** für Prisma
- **Anon Key** nur für Client-seitige Supabase-Operationen
- **Keine direkten API-Aufrufe** von Client zu Supabase

## 🔧 **Sofortige Maßnahmen**

### 1. RLS aktivieren (für zukünftige Supabase Auth Migration)

```bash
npm run enable-rls
```

### 2. API-Schlüssel überprüfen

Stellen Sie sicher, dass in Vercel nur diese Keys gesetzt sind:
- `SUPABASE_SERVICE_ROLE_KEY` (für Prisma)
- `SUPABASE_ANON_KEY` (optional, für Client-Operationen)

### 3. Netzwerk-Zugriff beschränken

In Supabase → Settings → API:
- Aktivieren Sie **"Restrict access to specific domains"**
- Fügen Sie nur Ihre Vercel-Domain hinzu

## 📊 **Aktuelle Sicherheit**

✅ **Sicher:**
- API-Routen sind durch NextAuth.js geschützt
- Benutzer können nur ihre eigenen Tasks sehen
- Passwörter sind mit bcrypt gehasht

⚠️ **Verbesserungsbedarf:**
- Supabase API ist öffentlich zugänglich
- RLS ist deaktiviert

## 🚀 **Empfohlene Lösung**

Da Sie NextAuth.js verwenden, ist die beste Strategie:

1. **RLS aktivieren** (für zukünftige Sicherheit)
2. **API-Zugriff nur über Ihre App** (bereits implementiert)
3. **Service Role Key** für alle Datenbankoperationen verwenden

## 📝 **Nützliche Befehle**

```bash
# RLS aktivieren
npm run enable-rls

# Sicherheitsstatus prüfen
npm run check-security

# Datenbankstruktur einrichten
npm run setup-db
```

## 🔍 **Überprüfung**

Nach der Aktivierung sollten Sie in Supabase sehen:
- ✅ "RLS is enabled" für beide Tabellen
- ✅ Sicherheitsrichtlinien sind aktiv
- ⚠️ "Data is accessible via API" (normal bei NextAuth.js)
