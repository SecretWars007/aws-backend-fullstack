-- ─── Wallet Service: Database Schema ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallet_cards (
  id                  SERIAL PRIMARY KEY,
  customer_id         INT UNIQUE NOT NULL,
  account_number      VARCHAR(20) NOT NULL,
  currency            VARCHAR(10) NOT NULL DEFAULT 'BOL',
  type                VARCHAR(10) NOT NULL DEFAULT 'BIL',
  balance             DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  enable              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movements (
  id                  SERIAL PRIMARY KEY,
  customer_id         INT NOT NULL,
  amount              DECIMAL(12, 2) NOT NULL,
  currency            VARCHAR(10) NOT NULL DEFAULT 'BOL',
  type                INT NOT NULL, -- 1=Transfer, 12=Tigo, 13=Entel, 14=Viva
  description         VARCHAR(255) NOT NULL,
  detail              VARCHAR(255) NOT NULL,
  destination_account VARCHAR(50) NOT NULL,
  destination_account_name VARCHAR(100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfer_sessions (
  id                  SERIAL PRIMARY KEY,
  customer_id         INT NOT NULL,
  cellphone           VARCHAR(20) NOT NULL,
  amount              DECIMAL(12, 2) NOT NULL,
  token               VARCHAR(6) NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_cards_customer ON wallet_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_movements_customer ON movements(customer_id);
