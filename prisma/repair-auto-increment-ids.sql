-- One-time repair for databases where `prisma db push` partially changed the
-- primary keys before PostgreSQL allowed the referenced natural keys to move
-- from PRIMARY KEY constraints to UNIQUE constraints.
--
-- This only removes foreign-key constraints. `prisma db push` recreates them
-- immediately afterward from schema.prisma.

BEGIN;

ALTER TABLE IF EXISTS "store_access"
  DROP CONSTRAINT IF EXISTS "store_access_user_id_fkey",
  DROP CONSTRAINT IF EXISTS "store_access_store_code_fkey";

ALTER TABLE IF EXISTS "notification_preferences"
  DROP CONSTRAINT IF EXISTS "notification_preferences_user_id_fkey",
  DROP CONSTRAINT IF EXISTS "notification_preferences_store_code_fkey",
  DROP CONSTRAINT IF EXISTS "notification_preferences_notification_type_fkey";

ALTER TABLE IF EXISTS "notification_events"
  DROP CONSTRAINT IF EXISTS "notification_events_store_code_fkey",
  DROP CONSTRAINT IF EXISTS "notification_events_notification_type_fkey";

ALTER TABLE IF EXISTS "user_notifications"
  DROP CONSTRAINT IF EXISTS "user_notifications_user_id_fkey",
  DROP CONSTRAINT IF EXISTS "user_notifications_notification_event_id_fkey",
  DROP CONSTRAINT IF EXISTS "user_notifications_store_code_fkey";

ALTER TABLE IF EXISTS "push_subscriptions"
  DROP CONSTRAINT IF EXISTS "push_subscriptions_user_id_fkey";

ALTER TABLE IF EXISTS "pos_credentials"
  DROP CONSTRAINT IF EXISTS "pos_credentials_store_code_fkey";

COMMIT;
