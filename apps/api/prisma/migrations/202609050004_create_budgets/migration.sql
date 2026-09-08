CREATE TYPE "BudgetCategory" AS ENUM (
  'FOOD',
  'TRANSPORT',
  'HOUSING',
  'HEALTH',
  'EDUCATION',
  'ENTERTAINMENT',
  'OTHER'
);

CREATE TABLE "budgets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL,
  "month" DATE NOT NULL,
  "currency" "Currency" NOT NULL,
  "category" "BudgetCategory" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "budgets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "budgets_month_start" CHECK (EXTRACT(DAY FROM "month") = 1),
  CONSTRAINT "budgets_amount_positive" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "budgets_owner_id_month_currency_category_key"
  ON "budgets"("owner_id", "month", "currency", "category");
CREATE INDEX "budgets_owner_id_month_currency_idx"
  ON "budgets"("owner_id", "month", "currency");

ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON TABLE "budgets" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON TABLE "budgets" FROM authenticated; END IF;
END $$;
