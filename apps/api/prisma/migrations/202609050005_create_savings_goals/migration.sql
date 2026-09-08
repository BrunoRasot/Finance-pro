CREATE TABLE "savings_goals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "currency" "Currency" NOT NULL,
  "target_amount" DECIMAL(18,2) NOT NULL,
  "deadline" DATE,
  "archived_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "savings_goals_target_positive" CHECK ("target_amount" > 0)
);

CREATE UNIQUE INDEX "savings_goals_id_owner_id_key" ON "savings_goals"("id", "owner_id");
CREATE INDEX "savings_goals_owner_id_archived_at_created_at_id_idx"
  ON "savings_goals"("owner_id", "archived_at", "created_at", "id");

CREATE TABLE "goal_contributions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL,
  "goal_id" UUID NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "date" DATE NOT NULL,
  "note" VARCHAR(250) NOT NULL,
  "idempotency_key" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goal_contributions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "goal_contributions_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "goal_contributions_goal_id_owner_id_fkey"
    FOREIGN KEY ("goal_id", "owner_id") REFERENCES "savings_goals"("id", "owner_id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX "goal_contributions_owner_id_idempotency_key_key"
  ON "goal_contributions"("owner_id", "idempotency_key");
CREATE INDEX "goal_contributions_goal_id_owner_id_date_created_at_id_idx"
  ON "goal_contributions"("goal_id", "owner_id", "date", "created_at", "id");

ALTER TABLE "savings_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "goal_contributions" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "savings_goals" FROM anon;
    REVOKE ALL ON TABLE "goal_contributions" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "savings_goals" FROM authenticated;
    REVOKE ALL ON TABLE "goal_contributions" FROM authenticated;
  END IF;
END $$;
