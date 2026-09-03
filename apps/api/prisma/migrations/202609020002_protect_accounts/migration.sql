-- The backend authorizes users. Direct Supabase Data API access is not supported.
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "public"."accounts" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "public"."accounts" FROM authenticated;
  END IF;
END
$$;
