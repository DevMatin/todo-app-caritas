const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Lade .env.local manuell
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        process.env[key.trim()] = value.trim()
      }
    })
  }
}

loadEnvFile()

async function testSpecificTaskUpdate() {
  console.log('🧪 Test: Spezifische Task-Aktualisierung')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase-Konfiguration fehlt!')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Teste die spezifische Task aus dem n8n Webhook
  const externalId = '1614531618771305515'
  const userEmail = 'faal@caritas-erlangen.de'
  
  console.log(`🔍 Suche Task mit External ID: ${externalId}`)
  console.log(`👤 User E-Mail: ${userEmail}`)
  
  try {
    // 1. User finden
    console.log('\n1️⃣ Suche User...')
    const { data: foundUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()
    
    if (userError) {
      console.error('❌ User-Fehler:', userError)
      return
    }
    
    console.log(`✅ User gefunden: ${foundUser.name} (${foundUser.id})`)
    
    // 2. Task finden
    console.log('\n2️⃣ Suche Task...')
    const { data: existingTask, error: taskFindError } = await supabase
      .from('tasks')
      .select('*')
      .eq('external_id', externalId)
      .eq('user_id', foundUser.id)
      .single()
    
    if (taskFindError) {
      console.error('❌ Task-Fehler:', taskFindError)
      return
    }
    
    console.log(`✅ Task gefunden: ${existingTask.title}`)
    console.log(`   Aktuelle Priorität: ${existingTask.priority}`)
    console.log(`   Aktueller Status: ${existingTask.status}`)
    
    // 3. Task aktualisieren (wie im Webhook)
    console.log('\n3️⃣ Aktualisiere Task...')
    const updateData = {
      status: 'in_bearbeitung',
      priority: 'Priorität 1',
      label: 'hoch',
      updated_at: new Date().toISOString()
    }
    
    console.log('Update-Daten:', updateData)
    
    const { data: updatedTask, error: updateTaskError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', existingTask.id)
      .select()
      .single()
    
    if (updateTaskError) {
      console.error('❌ Update-Fehler:', updateTaskError)
      console.error('Fehler-Details:', {
        code: updateTaskError.code,
        message: updateTaskError.message,
        details: updateTaskError.details,
        hint: updateTaskError.hint
      })
      return
    }
    
    console.log('✅ Task erfolgreich aktualisiert!')
    console.log(`   Neue Priorität: ${updatedTask.priority}`)
    console.log(`   Neuer Status: ${updatedTask.status}`)
    console.log(`   Neues Label: ${updatedTask.label}`)
    
    // 4. Zurück ändern
    console.log('\n4️⃣ Setze Priorität zurück...')
    await supabase
      .from('tasks')
      .update({ 
        priority: existingTask.priority,
        status: existingTask.status,
        label: existingTask.label,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingTask.id)
    
    console.log('🔄 Priorität zurückgesetzt')
    
  } catch (error) {
    console.error('❌ Allgemeiner Fehler:', error)
  }
}

testSpecificTaskUpdate()
