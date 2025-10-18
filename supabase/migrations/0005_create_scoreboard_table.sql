-- Create scoreboard table for sports competition
CREATE TABLE IF NOT EXISTS scoreboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL, -- 종목명
  team_name TEXT NOT NULL, -- 팀명 (빨강, 노랑, 초록, 파랑)
  rank INTEGER NOT NULL, -- 순위 (1, 2, 3, 4)
  score INTEGER NOT NULL DEFAULT 0, -- 점수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_name, team_name)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_scoreboard_team ON scoreboard(team_name);
CREATE INDEX IF NOT EXISTS idx_scoreboard_event ON scoreboard(event_name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_scoreboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scoreboard_updated_at
  BEFORE UPDATE ON scoreboard
  FOR EACH ROW
  EXECUTE FUNCTION update_scoreboard_updated_at();

-- Insert default events (optional - for initialization)
-- This ensures all events exist in the system
COMMENT ON TABLE scoreboard IS '체육대회 점수판 - 종목별 팀 점수 기록';