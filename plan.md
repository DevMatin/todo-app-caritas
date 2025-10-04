# Build-Zeit Optimierungsplan

## Ziel

Build-Zeit von ~2-4 Minuten auf **unter 1 Minute** reduzieren (bei wiederholten Builds mit Cache).

## Optimierungen

### 1. Build-Script vereinfachen (package.json)

**Aktuelles Problem**:

```json
"build": "node scripts/generate-database-url.js && prisma generate && prisma migrate deploy && next build"
```

**Lösung**:

- `generate-database-url.js` vereinfachen (Console-Logs entfernen)
- `prisma generate` aus Build-Script entfernen (wird bereits in postinstall ausgeführt)
- `prisma migrate deploy` optional machen (nicht bei jedem Build nötig)

**Neue Build-Scripts**:

```json
"build": "node scripts/generate-database-url.js && next build",
"build:full": "prisma generate && prisma migrate deploy && npm run build"
```

**Dateien**: `package.json`, `scripts/generate-database-url.js`

### 2. Next.js Standalone-Output (next.config.js)

**Lösung**: Standalone-Output aktivieren für kleinere und schnellere Production-Builds.

```javascript
output: 'standalone',
```

**Datei**: `next.config.js`

### 3. Console-Logs reduzieren (generate-database-url.js)

**Aktuelles Problem**: 8+ Console-Log-Aufrufe verlangsamen das Script.

**Lösung**: Nur kritische Fehler loggen, Success-Messages entfernen.

**Datei**: `scripts/generate-database-url.js` (Zeilen 10-38, 71-88)

### 4. TypeScript Incremental Build

**Lösung**: Bereits aktiviert in `tsconfig.json` - sicherstellen, dass `.next`-Cache nicht gelöscht wird.

### 5. Docker-Entfernung

**Lösung**: Alle Docker-Dateien entfernt, da Vercel + Supabase verwendet wird.

- Keine Container-Builds mehr nötig
- Direktes Vercel-Deployment
- Supabase als externe Datenbank

## Erwartete Verbesserungen

| Build-Typ | Vorher | Nachher |
|-----------|--------|---------|
| Erster Build (cold) | 3-4 Min | **30-60 Sek** |
| Wiederholter Build (warm) | 2-3 Min | **15-30 Sek** |
| Build bei Code-Änderung | 2-3 Min | **20-45 Sek** |

## Wichtigste Dateien

- `package.json` - Build-Script-Vereinfachung
- `scripts/generate-database-url.js` - Log-Reduzierung
- `next.config.js` - Standalone-Output
- `vercel.json` - Vercel-Konfiguration

### To-dos

- [x] Build-Script in package.json vereinfachen und alternative Scripts hinzufügen
- [x] Console-Logs in generate-database-url.js reduzieren
- [x] Next.js Standalone-Output in next.config.js aktivieren
- [x] Alle Docker-Dateien entfernen (Dockerfile*, docker-compose*, portainer-stack*)
- [x] Docker-Dokumentationen entfernen (PORTAINER_*.md)
