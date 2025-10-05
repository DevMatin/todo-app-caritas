-- Add priority column to tasks table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Check if priority column exists
DO $$
BEGIN
    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'priority'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "tasks" 
        ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'mittel';
        
        RAISE NOTICE 'priority column added to tasks table';
    ELSE
        RAISE NOTICE 'priority column already exists in tasks table';
    END IF;
END $$;

-- Update existing tasks to have default priority
UPDATE "tasks" 
SET "priority" = 'mittel' 
WHERE "priority" IS NULL OR "priority" = '';

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
