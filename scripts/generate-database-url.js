// scripts/generate-database-url.js
const fs = require('fs');
const path = require('path');

function generateDatabaseUrl() {
  // Lade .env Datei
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'env.example');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  }
  
  // Extrahiere SUPABASE_URL und SUPABASE_DB_PASSWORD
  const supabaseUrlMatch = envContent.match(/SUPABASE_URL="([^"]+)"/);
  const passwordMatch = envContent.match(/SUPABASE_DB_PASSWORD="([^"]+)"/);
  
  if (!supabaseUrlMatch) {
    console.error('SUPABASE_URL nicht gefunden in .env Datei');
    process.exit(1);
  }
  
  const supabaseUrl = supabaseUrlMatch[1];
  const password = passwordMatch ? passwordMatch[1] : 'your-password';
  
  // Extrahiere Project Reference aus URL
  const url = new URL(supabaseUrl);
  const projectRef = url.hostname.split('.')[0];
  
  // Generiere DATABASE_URL
  const databaseUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
  
  console.log('Generierte DATABASE_URL:', databaseUrl);
  
  // Setze DATABASE_URL in .env
  if (fs.existsSync(envPath)) {
    let envFile = fs.readFileSync(envPath, 'utf8');
    
    // Ersetze existierende DATABASE_URL oder füge neue hinzu
    if (envFile.includes('DATABASE_URL=')) {
      envFile = envFile.replace(/DATABASE_URL="[^"]*"/, `DATABASE_URL="${databaseUrl}"`);
    } else {
      envFile += `\nDATABASE_URL="${databaseUrl}"\n`;
    }
    
    fs.writeFileSync(envPath, envFile);
    console.log('DATABASE_URL wurde in .env aktualisiert');
  } else {
    console.log('Erstelle .env Datei...');
    fs.writeFileSync(envPath, `DATABASE_URL="${databaseUrl}"\n`);
  }
  
  return databaseUrl;
}

if (require.main === module) {
  generateDatabaseUrl();
}

module.exports = { generateDatabaseUrl };
