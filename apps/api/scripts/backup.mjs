import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile, stat, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

const tables = [
  'accounts',
  'transactions',
  'transfers',
  'budgets',
  'savings_goals',
  'goal_contributions',
  '_prisma_migrations',
];
const action = process.argv[2];
const file = resolve(process.argv[3] ?? '../../backups/finance-pro.dump');

function connection(name) {
  const raw = process.env[name];
  if (!raw) throw new Error(`Missing ${name}`);
  const url = new URL(raw);
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw new Error(`Invalid ${name}`);
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) &&
    url.searchParams.get('sslmode') !== 'verify-full'
  )
    throw new Error(
      `${name} requires sslmode=verify-full for remote databases`,
    );
  return { raw, url };
}

function run(binary, args, url) {
  const env = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGCONNECT_TIMEOUT: '10',
    PGSSLMODE: url.searchParams.get('sslmode') ?? 'prefer',
    ...(url.searchParams.has('sslrootcert')
      ? { PGSSLROOTCERT: url.searchParams.get('sslrootcert') }
      : {}),
  };
  const result = spawnSync(binary, args, {
    env,
    encoding: 'utf8',
    windowsHide: true,
  });
  // Tool output can contain private rows or connection details.
  if (result.error || result.status !== 0)
    throw new Error(
      `${binary} failed; check PostgreSQL tools, permissions, TLS and connectivity`,
    );
}

async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function fingerprints(client) {
  const result = {};
  for (const table of tables) {
    const hash = createHash('sha256');
    let count = 0;
    await client.query(
      `DECLARE backup_rows NO SCROLL CURSOR FOR SELECT to_jsonb(t)::text AS row FROM public."${table}" t ORDER BY id`,
    );
    while (true) {
      const batch = await client.query('FETCH 1000 FROM backup_rows');
      if (!batch.rows.length) break;
      for (const { row } of batch.rows) {
        hash.update(row + '\n');
        count++;
      }
    }
    await client.query('CLOSE backup_rows');
    result[table] = { count, sha256: hash.digest('hex') };
  }
  return result;
}

async function main() {
  if (!['create', 'verify'].includes(action))
    throw new Error('Use backup.mjs create|verify FILE');
  const { raw, url } = connection(
    action === 'create' ? 'BACKUP_DATABASE_URL' : 'RESTORE_DATABASE_URL',
  );
  const client = new pg.Client({
    connectionString: raw,
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  try {
    await client.query("SET timezone = 'UTC'");
    if (action === 'create') {
      await mkdir(resolve(file, '..'), { recursive: true });
      // Never overwrite a prior backup. The reservation also prevents two jobs colliding.
      await writeFile(file, '', { flag: 'wx', mode: 0o600 });
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const snapshot = (
        await client.query('SELECT pg_export_snapshot() AS snapshot')
      ).rows[0].snapshot;
      const state = await fingerprints(client);
      run(
        'pg_dump',
        [
          '--format=custom',
          '--schema=public',
          '--no-owner',
          '--no-privileges',
          `--snapshot=${snapshot}`,
          `--file=${file}.partial`,
        ],
        url,
      );
      await client.query('COMMIT');
      if (!(await stat(`${file}.partial`)).size)
        throw new Error('Backup is empty');
      await rename(`${file}.partial`, file);
      const manifest = {
        version: 1,
        createdAt: new Date().toISOString(),
        scope: 'public schema only; Supabase Auth is excluded',
        sha256: await digest(file),
        tables: state,
      };
      await writeFile(
        `${file}.json`,
        JSON.stringify(manifest, null, 2) + '\n',
        { flag: 'wx', mode: 0o600 },
      );
      console.log(
        JSON.stringify({
          event: 'backup_created',
          tables: tables.length,
          verified: false,
        }),
      );
    } else {
      if (!url.pathname.endsWith('_restore_test'))
        throw new Error('Restore destination must end in _restore_test');
      const existing = await client.query(
        "SELECT count(*)::int AS count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f')",
      );
      if (existing.rows[0].count !== 0)
        throw new Error(
          'Restore destination must be empty; no data will be overwritten',
        );
      const manifest = JSON.parse(await readFile(`${file}.json`, 'utf8'));
      if (manifest.version !== 1 || manifest.sha256 !== (await digest(file)))
        throw new Error('Backup integrity check failed');
      // pg_dump includes CREATE SCHEMA public. Drop only the empty schema:
      // no CASCADE, so types/functions or other dependencies also block restore.
      await client.query('DROP SCHEMA IF EXISTS public');
      // Policies refer to the non-login group; it must exist on the recovery cluster.
      run(
        'pg_restore',
        [
          '--exit-on-error',
          '--single-transaction',
          '--no-owner',
          '--no-privileges',
          '--dbname=' + decodeURIComponent(url.pathname.slice(1)),
          file,
        ],
        url,
      );
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const state = await fingerprints(client);
      await client.query('COMMIT');
      if (JSON.stringify(state) !== JSON.stringify(manifest.tables))
        throw new Error('Restored rows differ from the backup snapshot');
      console.log(
        JSON.stringify({
          event: 'restore_verified',
          tables: tables.length,
          exactRows: true,
        }),
      );
    }
  } finally {
    await client.end();
  }
}

main().catch(() => {
  // Do not print driver errors, database URLs or private records.
  console.error(
    'Backup/restore failed. Check variables, TLS, tool availability, unique backup filename and an empty *_restore_test destination. No existing database is cleared.',
  );
  process.exitCode = 1;
});
