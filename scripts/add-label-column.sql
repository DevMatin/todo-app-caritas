-- Add label column to tasks table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Check if label column exists and add it
DO $$
BEGIN
    -- Add label column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'label'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "tasks" 
        ADD COLUMN "label" TEXT;
        
        RAISE NOTICE 'label column added to tasks table';
    ELSE
        RAISE NOTICE 'label column already exists in tasks table';
    END IF;
END $$;

-- Update existing tasks to have correct labels based on priority
UPDATE "tasks" 
SET "label" = 'hoch' 
WHERE "priority" = 'Priorität 1';

UPDATE "tasks" 
SET "label" = 'mittel' 
WHERE "priority" = 'Priorität 2';

UPDATE "tasks" 
SET "label" = 'niedrig' 
WHERE "priority" = 'Priorität 3';

-- Update tasks with old priority values
UPDATE "tasks" 
SET "label" = 'hoch' 
WHERE "priority" = 'hoch';

UPDATE "tasks" 
SET "label" = 'mittel' 
WHERE "priority" = 'mittel';

UPDATE "tasks" 
SET "label" = 'niedrig' 
WHERE "priority" = 'niedrig';

-- Show current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data
SELECT 
    id, 
    title, 
    priority, 
    label, 
    status 
FROM "tasks" 
ORDER BY created_at DESC 
LIMIT 5;
