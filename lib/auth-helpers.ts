import { createClient } from '@/lib/supabase-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'

// Server-seitige User-Session abrufen
export async function getServerUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// User aus Supabase in Supabase DB synchronisieren
export async function syncUserToDatabase(supabaseUser: User) {
  try {
    // Verwende Supabase-Client mit Service Role Key für Datenbank-Operationen
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Prüfen ob User bereits in DB existiert
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('Fehler beim Suchen des Users:', findError)
      throw findError
    }
    
    if (existingUser) {
      // User existiert bereits, nur Email aktualisieren falls geändert
      if (existingUser.email !== supabaseUser.email) {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ 
            email: supabaseUser.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', supabaseUser.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('Fehler beim Aktualisieren des Users:', updateError)
          throw updateError
        }
        
        return updatedUser
      }
      return existingUser
    }
    
    // Neuen User in DB erstellen
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Fehler beim Erstellen des Users:', createError)
      throw createError
    }
    
    return newUser
  } catch (error) {
    console.error('Fehler beim Synchronisieren des Users:', error)
    throw error
  }
}

// Authentifizierten User mit DB-Daten abrufen
export async function getAuthenticatedUser() {
  const supabaseUser = await getServerUser()
  
  if (!supabaseUser) {
    return null
  }
  
  // User in DB synchronisieren
  const dbUser = await syncUserToDatabase(supabaseUser)
  
  return {
    supabaseUser,
    dbUser
  }
}
