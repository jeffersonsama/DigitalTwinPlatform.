-- Corrective migration: "isAdmin" was never created by any tracked migration (predates
-- migration history, superseded by the "accessRole" enum added in 20260817091221_access_roles),
-- which put the dev database in drift. This drops the orphan column so the schema matches
-- migration history again, without touching any other data.
ALTER TABLE "users" DROP COLUMN IF EXISTS "isAdmin";
