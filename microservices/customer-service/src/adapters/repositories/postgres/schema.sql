-- ─── Customer Service: Database Schema ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id                  SERIAL PRIMARY KEY,
  cellphone           VARCHAR(20) UNIQUE NOT NULL,
  document_number     VARCHAR(20) NOT NULL,
  document_type       VARCHAR(10) NOT NULL,
  document_extension  VARCHAR(5),
  document_complement VARCHAR(5),
  email               VARCHAR(255) UNIQUE NOT NULL,
  cic                 VARCHAR(50),
  home_address        VARCHAR(255),
  is_client           BOOLEAN NOT NULL DEFAULT FALSE,
  is_married          BOOLEAN NOT NULL DEFAULT FALSE,
  register_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  name                VARCHAR(100),
  last_name           VARCHAR(100),
  second_last_name    VARCHAR(100),
  city                VARCHAR(100),
  pin_hash            VARCHAR(64),
  cognito_sub         VARCHAR(255) UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_sessions (
  id                  SERIAL PRIMARY KEY,
  cellphone           VARCHAR(20) NOT NULL,
  otp_hash            VARCHAR(64) NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL,
  verified            BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS face_sessions (
  session_id          VARCHAR(255) PRIMARY KEY,
  cellphone           VARCHAR(20) NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_cellphone ON customers(cellphone);
CREATE INDEX IF NOT EXISTS idx_customers_doc ON customers(document_number, document_type);
CREATE INDEX IF NOT EXISTS idx_otp_cellphone ON otp_sessions(cellphone);
