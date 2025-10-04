# Todo-App Installation in Portainer

## Voraussetzungen
- Portainer ist installiert und läuft
- Docker und Docker Compose sind verfügbar
- Mindestens 2GB freier RAM
- Mindestens 5GB freier Speicherplatz

## Installation in Portainer

### Schritt 1: Repository vorbereiten
1. Laden Sie das gesamte Projekt auf Ihren Server herunter
2. Stellen Sie sicher, dass alle Dateien verfügbar sind

### Schritt 2: Umgebungsvariablen konfigurieren
1. Kopieren Sie `env.example` zu `.env`
2. Passen Sie die folgenden Werte an:
   ```
   POSTGRES_PASSWORD=ihr-sicheres-passwort
   NEXTAUTH_SECRET=ihr-32-zeichen-langer-geheimer-schlüssel
   NEXTAUTH_URL=http://ihr-server:3003
   ```

### Schritt 3: Portainer Stack erstellen
1. Öffnen Sie Portainer im Browser
2. Gehen Sie zu "Stacks" → "Add stack"
3. Geben Sie einen Namen ein: `todo-app`
4. Wählen Sie "Upload" und laden Sie die `docker-compose.portainer.yml` hoch
5. Fügen Sie die Umgebungsvariablen hinzu (aus der .env Datei)
6. Klicken Sie auf "Deploy the stack"

### Schritt 4: Überwachung
1. Überwachen Sie die Logs in Portainer
2. Die App sollte nach 2-3 Minuten unter `http://ihr-server:3003` verfügbar sein
3. Erste Registrierung: Gehen Sie zu `/register` um einen Admin-Benutzer zu erstellen

## Konfiguration

### Ports
- Standard: 3003 (konfigurierbar über APP_PORT)
- Datenbank: Intern (nicht extern zugänglich)

### Datenbank
- PostgreSQL 16 Alpine
- Automatische Migrationen beim Start
- Persistente Daten im Docker Volume

### Sicherheit
- Passwort-Hashing mit bcrypt
- NextAuth.js für Authentifizierung
- Umgebungsvariablen für sensible Daten

## Troubleshooting

### App startet nicht
1. Überprüfen Sie die Logs in Portainer
2. Stellen Sie sicher, dass alle Umgebungsvariablen gesetzt sind
3. Überprüfen Sie, ob der Port verfügbar ist

### Datenbank-Verbindung fehlgeschlagen
1. Warten Sie bis die Datenbank vollständig gestartet ist
2. Überprüfen Sie die DATABASE_URL
3. Stellen Sie sicher, dass die Passwörter korrekt sind

### Performance-Optimierung
- Für Produktionsumgebung: Erhöhen Sie die Ressourcen-Limits
- Aktivieren Sie SSL/TLS für HTTPS
- Konfigurieren Sie einen Reverse Proxy (Nginx)

## Updates
1. Laden Sie die neue Version hoch
2. Stoppen Sie den Stack
3. Starten Sie den Stack neu
4. Die Datenbank-Migrationen werden automatisch ausgeführt
