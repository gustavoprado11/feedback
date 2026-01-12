-- Add weekly_reports_enabled field to establishments table
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS weekly_reports_enabled BOOLEAN DEFAULT true;

-- Update existing records to have weekly reports enabled by default
UPDATE establishments
SET weekly_reports_enabled = true
WHERE weekly_reports_enabled IS NULL;
