CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "TransactionCategory" AS ENUM ('SALARY', 'FREELANCE', 'FOOD', 'TRANSPORT', 'HOUSING', 'HEALTH', 'EDUCATION', 'ENTERTAINMENT', 'OTHER');
CREATE UNIQUE INDEX "accounts_id_owner_id_key" ON "accounts"("id", "owner_id");
CREATE TABLE "transactions" (
  "id" UUID NOT NULL,
  "owner_id" UUID NOT NULL,
  "account_id" UUID NOT NULL,
  "type" "TransactionType" NOT NULL,
  "category" "TransactionCategory" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "date" DATE NOT NULL,
  "description" VARCHAR(250) NOT NULL,
  "idempotency_key" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transactions_account_id_owner_id_fkey" FOREIGN KEY ("account_id", "owner_id") REFERENCES "accounts"("id", "owner_id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "transactions_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "transactions_category_type" CHECK (
    "category" = 'OTHER' OR
    ("type" = 'INCOME' AND "category" IN ('SALARY', 'FREELANCE')) OR
    ("type" = 'EXPENSE' AND "category" IN ('FOOD', 'TRANSPORT', 'HOUSING', 'HEALTH', 'EDUCATION', 'ENTERTAINMENT'))
  )
);
CREATE UNIQUE INDEX "transactions_owner_id_idempotency_key_key" ON "transactions"("owner_id", "idempotency_key");
CREATE INDEX "transactions_account_id_owner_id_date_created_at_id_idx" ON "transactions"("account_id", "owner_id", "date", "created_at", "id");
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON TABLE "transactions" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON TABLE "transactions" FROM authenticated; END IF;
END $$;
