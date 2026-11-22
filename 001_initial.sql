CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, name VARCHAR(60) NOT NULL, email VARCHAR(254) UNIQUE NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')), is_active BOOLEAN NOT NULL DEFAULT TRUE,
  salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY, ticket_number VARCHAR(32) UNIQUE NOT NULL, user_id UUID NOT NULL REFERENCES users(id),
  subject VARCHAR(100) NOT NULL, category VARCHAR(32) NOT NULL, category_label VARCHAR(80) NOT NULL,
  priority VARCHAR(16) NOT NULL, related VARCHAR(40) NOT NULL DEFAULT '', message TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'open', status_label VARCHAR(40) NOT NULL DEFAULT 'Открыто',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY, ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author VARCHAR(16) NOT NULL, author_name VARCHAR(80) NOT NULL, message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY, ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id), original_name TEXT NOT NULL, stored_name TEXT NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL, size_bytes BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY, order_number VARCHAR(32) UNIQUE NOT NULL, user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(120) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'pending',
  status_label VARCHAR(60) NOT NULL DEFAULT 'Заявка получена', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), order_id UUID REFERENCES orders(id),
  stripe_session_id TEXT UNIQUE NOT NULL, amount_total INTEGER, currency VARCHAR(8),
  status VARCHAR(24) NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tickets_user_created_idx ON tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS attachments_ticket_idx ON attachments(ticket_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
