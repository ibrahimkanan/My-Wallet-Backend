-- ============================================================
-- محفظتي (mahfazti) - Database Schema (PostgreSQL / Neon)
-- v1 features: manual entry, categories, multi-wallet,
-- monthly budgets per category, recurring transactions,
-- monthly/yearly charts
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------
CREATE TYPE wallet_type AS ENUM ('cash', 'bank', 'card');
CREATE TYPE tx_type AS ENUM ('income', 'expense');
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- REFRESH TOKENS (one row per active session/device)
-- Access tokens (short-lived JWT) are NOT stored here - they're
-- verified statelessly via signature + expiry. Only the longer
-- lived refresh token needs to be revocable.
-- ------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL,              -- store a hash, never the raw token
    device_info  VARCHAR(255),               -- e.g. "iPhone 14 - Expo app"
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked      BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_hash ON refresh_tokens(token_hash);

-- ------------------------------------------------------------
-- WALLETS (cash / bank / card)
-- ------------------------------------------------------------
CREATE TABLE wallets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,           -- e.g. "cash", "bank"
    type        wallet_type NOT NULL,
    balance     NUMERIC(12,2) NOT NULL DEFAULT 0, -- cached running balance
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

-- ------------------------------------------------------------
-- CATEGORIES (per-user, income or expense)
-- ------------------------------------------------------------
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,           -- e.g. "food"
    type        tx_type NOT NULL,                -- income or expense
    icon        VARCHAR(50),                     -- optional, for UI
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);

CREATE INDEX idx_categories_user ON categories(user_id);

-- ------------------------------------------------------------
-- RECURRING TRANSACTIONS (templates: subscriptions, rent...)
-- Defined before transactions so transactions can reference it
-- ------------------------------------------------------------
CREATE TABLE recurring_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    type            tx_type NOT NULL,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    note            TEXT,
    frequency       recurrence_frequency NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,                        -- NULL = repeats indefinitely
    next_due_date   DATE NOT NULL,                -- when the next tx should be generated
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_due ON recurring_transactions(next_due_date) WHERE is_active = true;
CREATE INDEX idx_recurring_user ON recurring_transactions(user_id);

-- ------------------------------------------------------------
-- TRANSACTIONS (the core table - manual entries + generated
-- from recurring_transactions)
-- ------------------------------------------------------------
CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id               UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category_id             UUID REFERENCES categories(id) ON DELETE SET NULL,
    recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL,
    type                    tx_type NOT NULL,
    amount                  NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    note                    TEXT,
    transaction_date        DATE NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- these two indexes are what the Charts page (monthly/yearly) will lean on
CREATE INDEX idx_tx_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_tx_wallet ON transactions(wallet_id);
CREATE INDEX idx_tx_category ON transactions(category_id);

-- ------------------------------------------------------------
-- BUDGETS
-- category_id = NULL  -> the OVERALL monthly budget (e.g. 700 JD,
--                         every expense regardless of category
--                         subtracts from this)
-- category_id = <uuid> -> an OPTIONAL extra limit for one specific
--                         category, on top of the overall budget
-- ------------------------------------------------------------
CREATE TABLE budgets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    month       SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year        SMALLINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, category_id, month, year)
);

CREATE INDEX idx_budgets_user_period ON budgets(user_id, year, month);

-- Postgres allows multiple NULLs in a normal UNIQUE constraint, so this
-- partial index is what actually enforces "only ONE overall budget row
-- per user per month" (category_id IS NULL case).
CREATE UNIQUE INDEX idx_budgets_one_overall_per_period
    ON budgets(user_id, month, year)
    WHERE category_id IS NULL;