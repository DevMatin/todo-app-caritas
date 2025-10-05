// scripts/generate-database-url.js
const fs = require('fs');
const path = require('path');

function generateDatabaseUrl() {
  // Prüfe zuerst Environment Variables (für Vercel)
  const supabaseUrl = process.env.SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  
  if (supabaseUrl && password) {
    // Prüfe ob es Platzhalter-Werte sind
    if (supabaseUrl.includes('your-project-ref') || password.includes('your-database-password')) {
      console.error('❌ Platzhalter-Werte in Environment Variables gefunden!');
      console.error('Bitte setzen Sie die echten Supabase-Werte in Vercel Environment Variables');
      process.exit(1);
    }
    
    // Extrahiere Project Reference aus URL
    const url = new URL(supabaseUrl);
    const projectRef = url.hostname.split('.')[0];
    
    // Generiere DATABASE_URL (Transaction Pooler für Vercel)
    const databaseUrl = `postgresql://postgres.${projectRef}:${password}@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`;
    
    // Setze DATABASE_URL als Environment Variable für Prisma
    process.env.DATABASE_URL = databaseUrl;
    
    // Schreibe DATABASE_URL in eine temporäre .env Datei für Prisma
    const envPath = path.join(process.cwd(), '.env');
    fs.writeFileSync(envPath, `DATABASE_URL="${databaseUrl}"\n`);
    
    return databaseUrl;
  }
  
  // Fallback: Lade .env.local oder .env Datei (für lokale Entwicklung)
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envPath = path.join(process.cwd(), '.env');
  
  let envContent = '';
  let envFilePath = '';
  
  // Priorisiere .env.local über .env
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
    envFilePath = envLocalPath;
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    envFilePath = envPath;
  }
  
  // Extrahiere SUPABASE_URL und SUPABASE_DB_PASSWORD aus .env/.env.local
  const supabaseUrlMatch = envContent.match(/SUPABASE_URL="([^"]+)"/);
  const passwordMatch = envContent.match(/SUPABASE_DB_PASSWORD="([^"]+)"/);
  
  if (!supabaseUrlMatch) {
    console.error('SUPABASE_URL nicht gefunden in Environment Variables oder .env/.env.local Datei');
    console.error('Bitte setzen Sie SUPABASE_URL und SUPABASE_DB_PASSWORD in Vercel Environment Variables');
    console.error('Oder erstellen Sie eine .env.local oder .env Datei mit den echten Werten');
    process.exit(1);
  }
  
  const supabaseUrlFromFile = supabaseUrlMatch[1];
  const passwordFromFile = passwordMatch ? passwordMatch[1] : 'your-password';
  
  // Extrahiere Project Reference aus URL
  const url = new URL(supabaseUrlFromFile);
  const projectRef = url.hostname.split('.')[0];
  
  // Generiere DATABASE_URL
  const databaseUrl = `postgresql://postgres:${passwordFromFile}@db.${projectRef}.supabase.co:5432/postgres`;
  
  // Setze DATABASE_URL als Environment Variable für Prisma
  process.env.DATABASE_URL = databaseUrl;
  
  // Setze DATABASE_URL in die entsprechende .env Datei
  if (envFilePath) {
    let envFile = fs.readFileSync(envFilePath, 'utf8');
    
    // Ersetze existierende DATABASE_URL oder füge neue hinzu
    if (envFile.includes('DATABASE_URL=')) {
      envFile = envFile.replace(/DATABASE_URL="[^"]*"/, `DATABASE_URL="${databaseUrl}"`);
    } else {
      envFile += `\nDATABASE_URL="${databaseUrl}"\n`;
    }
    
    fs.writeFileSync(envFilePath, envFile);
  } else {
    // Fallback: Erstelle .env.local wenn keine .env Datei existiert
    fs.writeFileSync(envLocalPath, `DATABASE_URL="${databaseUrl}"\n`);
  }
  
  return databaseUrl;
}

if (require.main === module) {
  generateDatabaseUrl();
}

module.exports = { generateDatabaseUrl };
