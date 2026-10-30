CREATE TABLE IF NOT EXISTS subscriptions (
 id TEXT PRIMARY KEY, subscription TEXT NOT NULL, times TEXT NOT NULL,
 time_zone TEXT NOT NULL, next_due INTEGER NOT NULL, test_due INTEGER,
 last_test INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS subscriptions_due ON subscriptions(next_due);
CREATE TABLE IF NOT EXISTS deliveries (
 id TEXT PRIMARY KEY, subscription_id TEXT NOT NULL, due INTEGER NOT NULL,
 state TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS deliveries_updated ON deliveries(updated_at);
CREATE TABLE IF NOT EXISTS service_state (id TEXT PRIMARY KEY, value INTEGER NOT NULL);
