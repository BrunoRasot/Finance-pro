-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH', 'BANK', 'WALLET');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('PEN', 'USD');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "type" "AccountType" NOT NULL,
    "currency" "Currency" NOT NULL,
    "opening_balance" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_owner_id_created_at_id_idx" ON "accounts"("owner_id", "created_at", "id");

ALTER TABLE "accounts"
  ADD CONSTRAINT "accounts_opening_balance_nonnegative"
    CHECK ("opening_balance" >= 0 AND "opening_balance" <> 'NaN'::numeric),
  ADD CONSTRAINT "accounts_name_not_blank" CHECK (length(btrim("name")) > 0);
