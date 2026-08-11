CREATE TABLE IF NOT EXISTS research_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  participant_code TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_logs_session_id
ON research_logs (session_id);

CREATE INDEX IF NOT EXISTS idx_research_logs_logged_at
ON research_logs (logged_at DESC);
