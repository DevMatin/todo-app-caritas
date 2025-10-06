-- Migration Script: NextAuth.js zu Supabase Auth
-- Führt die notwendigen Änderungen an der Datenbank durch

-- 1. User-Tabelle für Supabase Auth vorbereiten
-- Entferne das password Feld (wird von Supabase Auth verwaltet)
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- 2. Ändere id Spalte zu UUID (falls noch nicht UUID)
-- Prüfe zuerst ob id bereits UUID ist und führe Migration durch

-- Prüfe ob Migration notwendig ist
DO $$
DECLARE
    current_data_type text;
    user_count integer;
    task_count integer;
BEGIN
    -- Prüfe den aktuellen Datentyp der id Spalte
    SELECT data_type INTO current_data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id';
    
    -- Führe Migration nur durch wenn id nicht bereits UUID ist
    IF current_data_type != 'uuid' THEN
        
        RAISE NOTICE 'Starte Migration von % zu UUID', current_data_type;
        
        -- Entferne Foreign Key Constraint zuerst
        ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
        
        -- Erstelle temporäre Spalte für UUID in users
        ALTER TABLE users ADD COLUMN temp_id UUID;
        
        -- Generiere UUIDs für bestehende Einträge
        UPDATE users SET temp_id = gen_random_uuid() WHERE temp_id IS NULL;
        
        -- Erstelle temporäre UUID Spalte in tasks Tabelle
        ALTER TABLE tasks ADD COLUMN temp_user_id UUID;
        
        -- Aktualisiere temp_user_id in tasks Tabelle mit den neuen UUIDs
        -- Verwende sichere Type Casts mit NULLIF für robuste UUID/TEXT Konvertierung
        UPDATE tasks 
        SET temp_user_id = users.temp_id 
        FROM users 
        WHERE NULLIF(tasks.user_id, '')::text = NULLIF(users.id, '')::text;
        
        -- Prüfe ob alle Tasks aktualisiert wurden
        SELECT COUNT(*) INTO task_count FROM tasks WHERE temp_user_id IS NULL;
        IF task_count > 0 THEN
            RAISE WARNING 'Nicht alle Tasks konnten aktualisiert werden: % Tasks ohne temp_user_id', task_count;
        END IF;
        
        -- Entferne alte user_id Spalte und benenne temp_user_id um
        ALTER TABLE tasks DROP COLUMN user_id;
        ALTER TABLE tasks RENAME COLUMN temp_user_id TO user_id;
        ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
        
        -- Entferne alte id Spalte und benenne temp_id um
        ALTER TABLE users DROP COLUMN id;
        ALTER TABLE users RENAME COLUMN temp_id TO id;
        ALTER TABLE users ALTER COLUMN id SET NOT NULL;
        ALTER TABLE users ADD PRIMARY KEY (id);
        
        -- Erstelle Foreign Key Constraint neu
        ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            
        RAISE NOTICE 'Migration von % zu UUID erfolgreich abgeschlossen', current_data_type;
    ELSE
        RAISE NOTICE 'id Spalte ist bereits UUID, keine Migration notwendig';
    END IF;
END $$;

-- 3. Row Level Security (RLS) für Supabase aktivieren
-- Aktiviere RLS für users Tabelle
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Aktiviere RLS für tasks Tabelle (falls noch nicht aktiv)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies für users Tabelle
-- User können nur ihre eigenen Daten sehen
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

-- User können ihre eigenen Daten aktualisieren
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- 5. RLS Policies für tasks Tabelle
-- User können nur ihre eigenen Tasks sehen
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid()::text = user_id);

-- User können nur ihre eigenen Tasks erstellen
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
CREATE POLICY "Users can create own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- User können nur ihre eigenen Tasks aktualisieren
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid()::text = user_id);

-- User können nur ihre eigenen Tasks löschen
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid()::text = user_id);

-- 6. Funktion für automatische User-Synchronisation
-- Erstellt automatisch einen User-Eintrag in der users Tabelle wenn ein neuer Supabase Auth User erstellt wird
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger für automatische User-Synchronisation
-- Löse die Funktion aus wenn ein neuer User in auth.users erstellt wird
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Cleanup: Entferne alte NextAuth Tabellen (falls vorhanden)
-- Diese Tabellen werden von NextAuth.js erstellt und sind nicht mehr nötig
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;

-- Migration abgeschlossen
SELECT 'Migration zu Supabase Auth erfolgreich abgeschlossen!' as status;
