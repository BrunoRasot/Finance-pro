CREATE TABLE "transfers" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "from_account_id" UUID NOT NULL,
  "to_account_id" UUID NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "date" DATE NOT NULL,
  "description" VARCHAR(250) NOT NULL,
  "idempotency_key" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transfers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transfers_from_account_id_owner_id_fkey"
    FOREIGN KEY ("from_account_id", "owner_id") REFERENCES "accounts"("id", "owner_id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "transfers_to_account_id_owner_id_fkey"
    FOREIGN KEY ("to_account_id", "owner_id") REFERENCES "accounts"("id", "owner_id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "transfers_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "transfers_different_accounts" CHECK ("from_account_id" <> "to_account_id")
);

CREATE UNIQUE INDEX "transfers_owner_id_idempotency_key_key"
  ON "transfers"("owner_id", "idempotency_key");
CREATE INDEX "transfers_owner_id_date_created_at_id_idx"
  ON "transfers"("owner_id", "date", "created_at", "id");

ALTER TABLE "transactions" ADD COLUMN "transfer_id" UUID;
CREATE INDEX "transactions_transfer_id_idx" ON "transactions"("transfer_id");
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_transfer_id_fkey"
  FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_type";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_type" CHECK (
  "category" IN ('OTHER', 'TRANSFER') OR
  ("type" = 'INCOME' AND "category" IN ('SALARY', 'FREELANCE')) OR
  ("type" = 'EXPENSE' AND "category" IN ('FOOD', 'TRANSPORT', 'HOUSING', 'HEALTH', 'EDUCATION', 'ENTERTAINMENT'))
);
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transfer_origin" CHECK (
  ("category" = 'TRANSFER' AND "transfer_id" IS NOT NULL) OR
  ("category" <> 'TRANSFER' AND "transfer_id" IS NULL)
);

ALTER TABLE "transfers" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON TABLE "transfers" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON TABLE "transfers" FROM authenticated; END IF;
END $$;

