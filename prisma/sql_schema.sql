-- ============================================================
-- StockMaster SaaS - PostgreSQL Schema
-- Compatible with DBeaver / pgAdmin / psql
-- Run this in your PostgreSQL database to create all tables
-- ============================================================

-- Enable UUID extension (optional, we use CUID via Prisma)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');
CREATE TYPE "ActivityAction" AS ENUM (
  'CREATE', 'UPDATE', 'DELETE',
  'LOGIN', 'LOGOUT',
  'STOCK_IN', 'STOCK_OUT', 'STOCK_ADJUST'
);

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────

CREATE TABLE users (
  id            VARCHAR(36)  NOT NULL,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password      VARCHAR(255) NOT NULL,
  role          "Role"       NOT NULL DEFAULT 'EMPLOYEE',
  "isActive"    BOOLEAN      NOT NULL DEFAULT TRUE,
  "lastLoginAt" TIMESTAMP,
  "createdAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),

  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);

-- ─────────────────────────────────────────────
-- ACCOUNTS (NextAuth OAuth providers)
-- ─────────────────────────────────────────────

CREATE TABLE accounts (
  id                  VARCHAR(36)  NOT NULL,
  "userId"            VARCHAR(36)  NOT NULL,
  type                VARCHAR(255) NOT NULL,
  provider            VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          INTEGER,
  token_type          VARCHAR(255),
  scope               VARCHAR(255),
  id_token            TEXT,
  session_state       VARCHAR(255),

  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_provider_providerAccountId_key UNIQUE (provider, "providerAccountId"),
  CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId")
    REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_accounts_userId ON accounts ("userId");

-- ─────────────────────────────────────────────
-- SESSIONS (NextAuth)
-- ─────────────────────────────────────────────

CREATE TABLE sessions (
  id             VARCHAR(36)  NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
  "userId"       VARCHAR(36)  NOT NULL,
  expires        TIMESTAMP    NOT NULL,

  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_sessionToken_key UNIQUE ("sessionToken"),
  CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId")
    REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_userId ON sessions ("userId");

-- ─────────────────────────────────────────────
-- VERIFICATION TOKENS
-- ─────────────────────────────────────────────

CREATE TABLE verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token      VARCHAR(255) NOT NULL,
  expires    TIMESTAMP    NOT NULL,

  CONSTRAINT verification_tokens_token_key UNIQUE (token),
  CONSTRAINT verification_tokens_identifier_token_key UNIQUE (identifier, token)
);

-- ─────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────

CREATE TABLE products (
  id          VARCHAR(36)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  sku         VARCHAR(100) NOT NULL,
  category    VARCHAR(100),
  "imageUrl"  VARCHAR(500),
  "isActive"  BOOLEAN      NOT NULL DEFAULT TRUE,
  "deletedAt" TIMESTAMP,
  "createdAt" TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP    NOT NULL DEFAULT NOW(),

  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_sku_key UNIQUE (sku)
);

CREATE INDEX idx_products_sku      ON products (sku);
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_isActive ON products ("isActive");
CREATE INDEX idx_products_deletedAt ON products ("deletedAt");

-- ─────────────────────────────────────────────
-- PRODUCT SIZES (Variants)
-- ─────────────────────────────────────────────

CREATE TABLE product_sizes (
  id            VARCHAR(36)     NOT NULL,
  "productId"   VARCHAR(36)     NOT NULL,
  size          VARCHAR(50)     NOT NULL,
  quantity      INTEGER         NOT NULL DEFAULT 0,
  "minQuantity" INTEGER         NOT NULL DEFAULT 0,
  "maxQuantity" INTEGER,
  price         DECIMAL(10, 2)  NOT NULL,
  "costPrice"   DECIMAL(10, 2),
  "createdAt"   TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP       NOT NULL DEFAULT NOW(),

  CONSTRAINT product_sizes_pkey PRIMARY KEY (id),
  CONSTRAINT product_sizes_productId_size_key UNIQUE ("productId", size),
  CONSTRAINT product_sizes_productId_fkey FOREIGN KEY ("productId")
    REFERENCES products (id) ON DELETE CASCADE
);

CREATE INDEX idx_product_sizes_productId ON product_sizes ("productId");

-- ─────────────────────────────────────────────
-- STOCK MOVEMENTS
-- ─────────────────────────────────────────────

CREATE TABLE stock_movements (
  id              VARCHAR(36)    NOT NULL,
  "productId"     VARCHAR(36)    NOT NULL,
  "productSizeId" VARCHAR(36)    NOT NULL,
  "userId"        VARCHAR(36)    NOT NULL,
  type            "MovementType" NOT NULL,
  quantity        INTEGER        NOT NULL,
  "previousQty"   INTEGER        NOT NULL,
  "newQty"        INTEGER        NOT NULL,
  reason          VARCHAR(500),
  reference       VARCHAR(100),
  "createdAt"     TIMESTAMP      NOT NULL DEFAULT NOW(),

  CONSTRAINT stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT stock_movements_productId_fkey FOREIGN KEY ("productId")
    REFERENCES products (id),
  CONSTRAINT stock_movements_productSizeId_fkey FOREIGN KEY ("productSizeId")
    REFERENCES product_sizes (id),
  CONSTRAINT stock_movements_userId_fkey FOREIGN KEY ("userId")
    REFERENCES users (id)
);

CREATE INDEX idx_stock_movements_productId     ON stock_movements ("productId");
CREATE INDEX idx_stock_movements_productSizeId ON stock_movements ("productSizeId");
CREATE INDEX idx_stock_movements_userId        ON stock_movements ("userId");
CREATE INDEX idx_stock_movements_type          ON stock_movements (type);
CREATE INDEX idx_stock_movements_createdAt     ON stock_movements ("createdAt");

-- ─────────────────────────────────────────────
-- ACTIVITY LOGS (Audit Trail)
-- ─────────────────────────────────────────────

CREATE TABLE activity_logs (
  id          VARCHAR(36)      NOT NULL,
  "userId"    VARCHAR(36),
  action      "ActivityAction" NOT NULL,
  entity      VARCHAR(100)     NOT NULL,
  "entityId"  VARCHAR(36),
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  metadata    JSONB,
  "createdAt" TIMESTAMP        NOT NULL DEFAULT NOW(),

  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_userId_fkey FOREIGN KEY ("userId")
    REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_logs_userId    ON activity_logs ("userId");
CREATE INDEX idx_activity_logs_action    ON activity_logs (action);
CREATE INDEX idx_activity_logs_entity    ON activity_logs (entity);
CREATE INDEX idx_activity_logs_createdAt ON activity_logs ("createdAt");

-- ─────────────────────────────────────────────
-- UPDATED AT TRIGGER (auto-update timestamps)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_sizes_updated_at
  BEFORE UPDATE ON product_sizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
-- USEFUL VIEWS FOR DBEAVER
-- ─────────────────────────────────────────────

-- View: Product inventory summary
CREATE OR REPLACE VIEW v_product_inventory AS
SELECT
  p.id,
  p.name,
  p.sku,
  p.category,
  p."isActive",
  COUNT(ps.id)       AS size_count,
  SUM(ps.quantity)   AS total_quantity,
  SUM(ps.quantity * ps.price) AS total_value
FROM products p
LEFT JOIN product_sizes ps ON ps."productId" = p.id
GROUP BY p.id, p.name, p.sku, p.category, p."isActive";

-- View: Low stock alerts
CREATE OR REPLACE VIEW v_low_stock AS
SELECT
  p.name  AS product_name,
  p.sku,
  ps.size,
  ps.quantity        AS current_qty,
  ps."minQuantity"   AS min_qty
FROM product_sizes ps
JOIN products p ON p.id = ps."productId"
WHERE ps.quantity <= ps."minQuantity"
  AND p."isActive" = TRUE;

-- View: Recent stock movements with details
CREATE OR REPLACE VIEW v_stock_movements_detail AS
SELECT
  sm.id,
  sm."createdAt",
  p.name   AS product_name,
  p.sku,
  ps.size,
  u.name   AS user_name,
  sm.type,
  sm.quantity,
  sm."previousQty",
  sm."newQty",
  sm.reason,
  sm.reference
FROM stock_movements sm
JOIN products      p  ON p.id  = sm."productId"
JOIN product_sizes ps ON ps.id = sm."productSizeId"
JOIN users         u  ON u.id  = sm."userId"
ORDER BY sm."createdAt" DESC;
