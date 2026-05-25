-- ─── Device Service: Database Schema ─────────────────────────────────────────
-- Runs once on first deploy (or in initDb handler in MOCK_MODE=false)

CREATE TABLE IF NOT EXISTS devices (
  id             SERIAL PRIMARY KEY,
  device_id      VARCHAR(255) UNIQUE NOT NULL,
  device_type    VARCHAR(50)  NOT NULL,
  encrypted_device TEXT,
  key            VARCHAR(64)  NOT NULL DEFAULT '',
  iv             VARCHAR(32)  NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS devices_updated_at ON devices;
CREATE TRIGGER devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
