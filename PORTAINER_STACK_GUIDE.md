# Portainer Stack Konfiguration für Todo-App

## Schnellstart-Anleitung

### 1. Stack in Portainer erstellen
1. Öffnen Sie Portainer
2. Gehen Sie zu "Stacks" → "Add stack"
3. Name: `todo-app-caritas`
4. Wählen Sie "Web editor" oder "Upload"

### 2. Docker Compose Inhalt
Verwenden Sie die Datei `portainer-stack.yml` oder kopieren Sie den Inhalt in den Web Editor.

### 3. Umgebungsvariablen setzen
Fügen Sie diese Variablen in Portainer hinzu:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ihr-sicheres-passwort-hier
POSTGRES_DB=todo
APP_PORT=3003
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=ihr-32-zeichen-langer-geheimer-schlüssel-hier
BCRYPT_SALT_ROUNDS=10
DOMAIN_NAME=localhost
```

### 4. Stack deployen
- Klicken Sie auf "Deploy the stack"
- Warten Sie 2-3 Minuten
- App ist verfügbar unter: `http://localhost:3003`

## Erweiterte Konfiguration

### Für Produktionsumgebung
```
NEXTAUTH_URL=https://ihre-domain.com
APP_PORT=80
DOMAIN_NAME=ihre-domain.com
POSTGRES_PASSWORD=sehr-sicheres-passwort-mit-sonderzeichen-123!
NEXTAUTH_SECRET=sehr-langer-geheimer-schlüssel-mindestens-32-zeichen-lang
```

### Mit Traefik Reverse Proxy
Die Stack-Konfiguration enthält bereits Traefik-Labels für automatische SSL-Zertifikate.

### Ressourcen-Limits hinzufügen
Fügen Sie in der docker-compose.yml hinzu:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## Überwachung und Wartung

### Logs anzeigen
- In Portainer: Stacks → todo-app-caritas → Logs

### Datenbank-Backup
```bash
docker exec todo-app-db pg_dump -U postgres todo > backup.sql
```

### Updates durchführen
1. Neue Version hochladen
2. Stack neu starten
3. Automatische Migrationen werden ausgeführt

## Troubleshooting

### Häufige Probleme
1. **Port bereits belegt**: Ändern Sie APP_PORT
2. **Datenbank-Verbindung**: Überprüfen Sie POSTGRES_PASSWORD
3. **NextAuth-Fehler**: Überprüfen Sie NEXTAUTH_SECRET und NEXTAUTH_URL

### Support
Bei Problemen überprüfen Sie:
- Portainer Logs
- Container Health Status
- Netzwerk-Konfiguration
- Umgebungsvariablen
