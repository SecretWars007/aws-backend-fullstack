-- ─────────────────────────────────────────────────────────────────────────────
-- Yape/BCP Bolivia - Database Schema
-- Compatible with PostgreSQL 14+
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Devices table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
    id              BIGSERIAL PRIMARY KEY,
    device_id       VARCHAR(64)  NOT NULL UNIQUE,
    device_type     VARCHAR(16)  NOT NULL DEFAULT 'android',
    certified_id    INTEGER      NOT NULL DEFAULT 0,
    encrypted_device VARCHAR(256),
    user_id         BIGINT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);

-- ── Users table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                   BIGSERIAL PRIMARY KEY,
    cellphone            VARCHAR(20)  NOT NULL UNIQUE,
    email                VARCHAR(255) NOT NULL UNIQUE,
    document_number      VARCHAR(30)  NOT NULL,
    document_type        VARCHAR(5)   NOT NULL,
    document_extension   VARCHAR(5),
    document_complement  VARCHAR(10),
    cic                  VARCHAR(20),
    home_address         TEXT,
    is_client            BOOLEAN      NOT NULL DEFAULT false,
    is_married           BOOLEAN      NOT NULL DEFAULT false,
    is_citizen_eeuu      BOOLEAN      NOT NULL DEFAULT false,
    cognito_sub          VARCHAR(64),
    register_completed   BOOLEAN      NOT NULL DEFAULT false,
    pin_hash             VARCHAR(256),
    city                 VARCHAR(100),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_cellphone ON users(cellphone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);

-- ── OTP sessions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_sessions (
    id             BIGSERIAL PRIMARY KEY,
    cellphone      VARCHAR(20)  NOT NULL,
    certified_id   INTEGER      NOT NULL,
    otp_hash       VARCHAR(256) NOT NULL,
    verified       BOOLEAN      NOT NULL DEFAULT false,
    expires_at     TIMESTAMPTZ  NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_cellphone ON otp_sessions(cellphone);

-- ── Face recognition sessions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS face_sessions (
    id             BIGSERIAL PRIMARY KEY,
    session_id     VARCHAR(128) NOT NULL UNIQUE,
    cellphone      VARCHAR(20)  NOT NULL,
    certified_id   INTEGER      NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING | VERIFIED | FAILED
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at     TIMESTAMPTZ  NOT NULL
);

-- ── Wallet accounts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_accounts (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users(id),
    account_number VARCHAR(30)  NOT NULL UNIQUE,
    currency       VARCHAR(5)   NOT NULL DEFAULT 'BOL',
    account_type   VARCHAR(5)   NOT NULL DEFAULT 'BIL',
    balance        NUMERIC(18,2) NOT NULL DEFAULT 0,
    pan            VARCHAR(30),
    expiration_date VARCHAR(10),
    code           VARCHAR(20),
    image          TEXT,
    enable         BOOLEAN      NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Wallet transactions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id                        BIGSERIAL PRIMARY KEY,
    wallet_account_id         BIGINT       NOT NULL REFERENCES wallet_accounts(id),
    date                      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    amount                    NUMERIC(18,2) NOT NULL,
    currency                  VARCHAR(5)   NOT NULL DEFAULT 'BOL',
    type                      INTEGER      NOT NULL,
    description               VARCHAR(255),
    detail                    TEXT,
    destination_account       VARCHAR(30),
    destination_account_name  VARCHAR(255),
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Reference codes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reference_codes (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users(id),
    code           VARCHAR(50)  NOT NULL,
    applied        BOOLEAN      NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Update timestamp trigger ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_wallet_updated_at
    BEFORE UPDATE ON wallet_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
