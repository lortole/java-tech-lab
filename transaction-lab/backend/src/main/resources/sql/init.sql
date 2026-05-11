-- ─────────────────────────────────────────────────────────
-- Transaction Lab — Schéma PostgreSQL
-- Module ACID : comptes bancaires
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounts (
    id          BIGSERIAL PRIMARY KEY,
    owner       VARCHAR(100) NOT NULL,
    balance     DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    version     BIGINT NOT NULL DEFAULT 0,   -- optimistic locking
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT balance_positive CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS transfers (
    id              BIGSERIAL PRIMARY KEY,
    from_account_id BIGINT NOT NULL REFERENCES accounts(id),
    to_account_id   BIGINT NOT NULL REFERENCES accounts(id),
    amount          DECIMAL(15, 2) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT amount_positive CHECK (amount > 0),
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'COMPLETED', 'ROLLED_BACK', 'FAILED'))
);

-- ─────────────────────────────────────────────────────────
-- Module SAGA : commandes e-commerce
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id          BIGSERIAL PRIMARY KEY,
    saga_id     UUID NOT NULL UNIQUE,
    customer_id VARCHAR(50) NOT NULL,
    product_id  VARCHAR(50) NOT NULL,
    quantity    INT NOT NULL DEFAULT 1,
    amount      DECIMAL(15, 2) NOT NULL,
    status      VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_order_status CHECK (
        status IN ('PENDING','INVENTORY_RESERVED','PAYMENT_PROCESSING',
                   'CONFIRMED','CANCELLED','COMPENSATION_IN_PROGRESS')
    )
);

CREATE TABLE IF NOT EXISTS inventory (
    product_id  VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    stock       INT NOT NULL DEFAULT 0,
    reserved    INT NOT NULL DEFAULT 0,
    CONSTRAINT stock_positive CHECK (stock >= 0),
    CONSTRAINT reserved_positive CHECK (reserved >= 0),
    CONSTRAINT reserved_lte_stock CHECK (reserved <= stock)
);

-- Idempotence : table des événements déjà traités
CREATE TABLE IF NOT EXISTS processed_events (
    event_id    VARCHAR(100) PRIMARY KEY,
    topic       VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- Données de démonstration
-- ─────────────────────────────────────────────────────────

INSERT INTO accounts (owner, balance) VALUES
    ('Alice Martin',  1000.00),
    ('Bob Dupont',     500.00),
    ('Chloé Bernard', 2500.00)
ON CONFLICT DO NOTHING;

INSERT INTO inventory (product_id, product_name, stock, reserved) VALUES
    ('PROD-001', 'Laptop Pro 16"',  10, 0),
    ('PROD-002', 'Casque Bluetooth', 50, 0),
    ('PROD-003', 'Webcam 4K',        5, 0)
ON CONFLICT DO NOTHING;