import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import pg from 'pg';

const action = process.argv[2];
if (!['check', 'migrate', 'backup'].includes(action)) {
  throw new Error('Expected check, migrate or backup');
}

async function main() {
  if (!existsSync('.env.supabase'))
    throw new Error('Save DATABASE_URL in apps/api/.env.supabase first.');
  const settings = parse(readFileSync('.env.supabase'));
  let url;
  try {
    url = new URL(settings.DATABASE_URL);
  } catch {
    throw new Error('Invalid DATABASE_URL in .env.supabase');
  }
  const project = 'dwzmnnyriehtcceugnbz';
  const direct = url.hostname === `db.${project}.supabase.co`;
  const session =
    url.hostname.endsWith('.pooler.supabase.com') &&
    decodeURIComponent(url.username).endsWith(`.${project}`);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    (!direct && !session) ||
    (url.port && url.port !== '5432') ||
    url.pathname !== '/postgres'
  ) {
    throw new Error(
      'Connection must target the Finance Pro Supabase project, database postgres, direct or session mode on port 5432.',
    );
  }
  // Require certificate verification instead of silently disabling TLS validation.
  url.searchParams.set('sslmode', 'verify-full');
  if (settings.SUPABASE_CA_CERT) {
    const certificate = resolve(settings.SUPABASE_CA_CERT);
    if (!existsSync(certificate))
      throw new Error('SUPABASE_CA_CERT file not found.');
    url.searchParams.set('sslrootcert', certificate);
  }
  const connectionString = url.toString();
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    const result = await client.query(
      "SELECT to_regclass('public.accounts') IS NOT NULL AS accounts, to_regclass('public._prisma_migrations') IS NOT NULL AS migrations",
    );
    const state = result.rows[0];
    console.log(JSON.stringify({ connected: true, project, ...state }));
    if (action === 'migrate' && state.accounts && !state.migrations) {
      throw new Error(
        'An existing accounts table has no Prisma migration history. Review it before migrating.',
      );
    }
  } finally {
    await client.end();
  }
  if (action === 'migrate') {
    const result = spawnSync(
      process.execPath,
      ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
      {
        env: { ...process.env, DATABASE_URL: connectionString },
        stdio: 'inherit',
      },
    );
    if (result.status !== 0)
      throw new Error(
        'Migration failed. Review Prisma output before retrying.',
      );
  }
  if (action === 'backup') {
    const filename =
      process.argv[3] ??
      `../../backups/supabase-${new Date().toISOString().replaceAll(':', '-')}.dump`;
    const result = spawnSync(
      process.execPath,
      ['scripts/backup.mjs', 'create', filename],
      {
        env: { ...process.env, BACKUP_DATABASE_URL: connectionString },
        stdio: 'inherit',
        windowsHide: true,
      },
    );
    if (result.status !== 0) throw new Error('Supabase backup failed.');
  }
}

main().catch((error) => {
  if (error?.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
    console.error(
      'Supabase CA certificate required. Download it from Database Settings > SSL Configuration and set SUPABASE_CA_CERT in .env.supabase.',
    );
    process.exitCode = 1;
    return;
  }
  // Driver errors may contain connection details; print only a code for those.
  const message =
    error instanceof Error && !('code' in error)
      ? error.message
      : 'Database connection failed; check credentials, TLS and network access.';
  console.error(message);
  process.exitCode = 1;
});
