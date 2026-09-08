ALTER TABLE "accounts"
  ADD COLUMN "archived_at" TIMESTAMPTZ(3);

DROP INDEX "accounts_owner_id_created_at_id_idx";

CREATE INDEX "accounts_owner_id_archived_at_created_at_id_idx"
  ON "accounts"("owner_id", "archived_at", "created_at", "id");
