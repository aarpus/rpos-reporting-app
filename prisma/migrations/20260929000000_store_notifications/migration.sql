CREATE TYPE "AuthRole" AS ENUM ('ADMIN', 'USER');

ALTER TABLE "auth_users"
  ADD COLUMN "role" "AuthRole" NOT NULL DEFAULT 'USER';

CREATE TABLE "stores" (
  "store_code" VARCHAR(64) PRIMARY KEY,
  "name" VARCHAR(160) NOT NULL,
  "timezone" VARCHAR(80) NOT NULL DEFAULT 'UTC',
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stores_code_canonical_check" CHECK ("store_code" = upper(trim("store_code")) AND length("store_code") > 0)
);

INSERT INTO "stores" ("store_code", "name") VALUES
  ('DT01', 'Downtown Store'),
  ('AP01', 'Airport Store'),
  ('WS01', 'Westside Store');

CREATE TABLE "store_access" (
  "user_id" UUID NOT NULL REFERENCES "auth_users"("id") ON DELETE CASCADE,
  "store_code" VARCHAR(64) NOT NULL REFERENCES "stores"("store_code") ON DELETE CASCADE ON UPDATE RESTRICT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id", "store_code")
);
CREATE INDEX "store_access_store_code_idx" ON "store_access"("store_code");

CREATE TABLE "notification_types" (
  "key" VARCHAR(40) PRIMARY KEY,
  "label" VARCHAR(100) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "notification_types" ("key", "label") VALUES
  ('SHIFT_END', 'Shift ended'),
  ('DAY_END', 'Business day closed'),
  ('LOW_STOCK', 'Low stock'),
  ('VOID_REFUND', 'Void or refund');

CREATE TABLE "notification_preferences" (
  "user_id" UUID NOT NULL REFERENCES "auth_users"("id") ON DELETE CASCADE,
  "store_code" VARCHAR(64) NOT NULL REFERENCES "stores"("store_code") ON DELETE CASCADE ON UPDATE RESTRICT,
  "notification_type" VARCHAR(40) NOT NULL REFERENCES "notification_types"("key") ON DELETE RESTRICT ON UPDATE RESTRICT,
  "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("user_id", "store_code", "notification_type")
);
CREATE INDEX "notification_preferences_delivery_idx" ON "notification_preferences"("store_code", "notification_type", "enabled");

CREATE TABLE "notification_events" (
  "id" UUID PRIMARY KEY,
  "event_id" VARCHAR(160) NOT NULL,
  "store_code" VARCHAR(64) NOT NULL REFERENCES "stores"("store_code") ON DELETE RESTRICT ON UPDATE RESTRICT,
  "notification_type" VARCHAR(40) NOT NULL REFERENCES "notification_types"("key") ON DELETE RESTRICT ON UPDATE RESTRICT,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL,
  "payload" JSONB NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "body" VARCHAR(500) NOT NULL,
  "target_path" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("store_code", "event_id")
);
CREATE INDEX "notification_events_store_created_idx" ON "notification_events"("store_code", "created_at" DESC);

CREATE TABLE "user_notifications" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "auth_users"("id") ON DELETE CASCADE,
  "notification_event_id" UUID NOT NULL REFERENCES "notification_events"("id") ON DELETE CASCADE,
  "store_code" VARCHAR(64) NOT NULL REFERENCES "stores"("store_code") ON DELETE CASCADE ON UPDATE RESTRICT,
  "read_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("user_id", "notification_event_id")
);
CREATE INDEX "user_notifications_inbox_idx" ON "user_notifications"("user_id", "store_code", "created_at" DESC);

CREATE TABLE "push_subscriptions" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "auth_users"("id") ON DELETE CASCADE,
  "endpoint" TEXT NOT NULL UNIQUE,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "expiration_time" TIMESTAMPTZ(6),
  "user_agent" VARCHAR(500),
  "failure_count" INTEGER NOT NULL DEFAULT 0,
  "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions"("user_id");

CREATE TABLE "pos_credentials" (
  "store_code" VARCHAR(64) NOT NULL REFERENCES "stores"("store_code") ON DELETE CASCADE ON UPDATE RESTRICT,
  "key_id" VARCHAR(80) NOT NULL,
  "encrypted_secret" TEXT NOT NULL,
  "iv" VARCHAR(64) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rotated_at" TIMESTAMPTZ(6),
  PRIMARY KEY ("store_code", "key_id")
);
