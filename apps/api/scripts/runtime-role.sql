-- Run with the migration administrator, in the application database.
-- The login/password is provisioned separately; never put credentials here.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finance_app') THEN
    CREATE ROLE finance_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
      NOREPLICATION NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO finance_app;
DO $$
DECLARE relation text;
BEGIN
  FOREACH relation IN ARRAY ARRAY[
    'accounts', 'transactions', 'transfers', 'budgets',
    'savings_goals', 'goal_contributions'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO finance_app', relation);
    EXECUTE format('DROP POLICY IF EXISTS finance_backend ON public.%I', relation);
    EXECUTE format('CREATE POLICY finance_backend ON public.%I TO finance_app USING (true) WITH CHECK (true)', relation);
  END LOOP;
END $$;

-- Grant finance_app to a dedicated non-owner login with no administrative
-- attributes. This role can manage application rows but cannot migrate/drop
-- tables or read Supabase auth data. User isolation remains enforced by the API.
-- Reapply after reviewing any migration that adds an application table.
