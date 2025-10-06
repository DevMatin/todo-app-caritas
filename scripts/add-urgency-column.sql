-- Add urgency column to tasks table
-- This column will store the urgency labels from Planka (Dringend, Mittel, Offen)

ALTER TABLE tasks ADD COLUMN urgency VARCHAR(50);

-- Add comment to document the column purpose
COMMENT ON COLUMN tasks.urgency IS 'Urgency level from Planka labels: Dringend, Mittel, Offen';

-- Create index for better query performance
CREATE INDEX idx_tasks_urgency ON tasks(urgency);

-- Update existing tasks to have null urgency (will be populated by webhooks)
UPDATE tasks SET urgency = NULL WHERE urgency IS NULL;
