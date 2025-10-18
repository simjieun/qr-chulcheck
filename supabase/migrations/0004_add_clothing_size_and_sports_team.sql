-- Add clothing_size and sports_team columns to attendees table
ALTER TABLE attendees
ADD COLUMN clothing_size TEXT,
ADD COLUMN sports_team TEXT;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_attendees_sports_team ON attendees(sports_team);
