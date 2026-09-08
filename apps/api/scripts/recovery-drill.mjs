import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

async function main() {
  const raw = process.env.TEST_DATABASE_URL;
  if (!raw) throw new Error('TEST_DATABASE_URL required');
  const url = new URL(raw);
  if (!url.pathname.endsWith('_test'))
    throw new Error('Dedicated test database required');
  const client = new pg.Client({ connectionString: raw });
  const owner = randomUUID();
  const account = randomUUID();
  const other = randomUUID();
  const transfer = randomUUID();
  const goal = randomUUID();
  const destination = `finance_${randomUUID().replaceAll('-', '')}_restore_test`;
  const target = new URL(url);
  target.pathname = '/' + destination;
  const file = resolve('../../.release-local', `${destination}.dump`);
  await client.connect();
  let created = false;
  function run(action, expectFailure = false) {
    const result = spawnSync(
      process.execPath,
      ['scripts/backup.mjs', action, file],
      {
        env: {
          ...process.env,
          BACKUP_DATABASE_URL: raw,
          RESTORE_DATABASE_URL: target.toString(),
        },
        encoding: 'utf8',
        windowsHide: true,
      },
    );
    if (
      result.error ||
      (expectFailure ? result.status === 0 : result.status !== 0)
    )
      throw new Error(`Recovery drill ${action} failed`);
    if (!expectFailure) process.stdout.write(result.stdout);
  }
  try {
    await client.query(await readFile('scripts/runtime-role.sql', 'utf8'));
    await client.query('BEGIN');
    for (const id of [account, other]) {
      await client.query(
        "INSERT INTO accounts(id,owner_id,name,type,currency,opening_balance) VALUES($1,$2,$3,'BANK','PEN','9999999999999999.99')",
        [id, owner, 'Prueba de recuperación ñ'],
      );
    }
    await client.query(
      "INSERT INTO transfers(id,owner_id,from_account_id,to_account_id,amount,date,description,idempotency_key) VALUES($1,$2,$3,$4,'12.01','2026-09-07','Transferencia',$5)",
      [transfer, owner, account, other, randomUUID()],
    );
    for (const [id, type] of [
      [account, 'EXPENSE'],
      [other, 'INCOME'],
    ]) {
      await client.query(
        "INSERT INTO transactions(id,owner_id,account_id,type,category,amount,date,description,idempotency_key,transfer_id) VALUES($1,$2,$3,$4,'TRANSFER','12.01','2026-09-07','Prueba',$5,$6)",
        [randomUUID(), owner, id, type, randomUUID(), transfer],
      );
    }
    await client.query(
      "INSERT INTO budgets(id,owner_id,month,currency,category,amount,updated_at) VALUES($1,$2,'2026-09-01','PEN','FOOD','250.99',now())",
      [randomUUID(), owner],
    );
    await client.query(
      "INSERT INTO savings_goals(id,owner_id,name,currency,target_amount,updated_at) VALUES($1,$2,'Meta de prueba','PEN','1000.01',now())",
      [goal, owner],
    );
    await client.query(
      "INSERT INTO goal_contributions(id,owner_id,goal_id,amount,date,note,idempotency_key) VALUES($1,$2,$3,'0.01','2026-09-07','Centavos exactos',$4)",
      [randomUUID(), owner, goal, randomUUID()],
    );
    await client.query('COMMIT');
    await client.query(`CREATE DATABASE "${destination}"`);
    created = true;
    run('create');
    run('verify');
    run('verify', true); // A populated destination must never be overwritten.
    run('create', true); // An existing backup must never be overwritten.
    console.log(
      JSON.stringify({
        event: 'recovery_drill_passed',
        overwriteProtection: true,
      }),
    );
  } finally {
    await client.query('ROLLBACK');
    for (const table of [
      'goal_contributions',
      'savings_goals',
      'budgets',
      'transactions',
      'transfers',
      'accounts',
    ])
      await client.query(`DELETE FROM "${table}" WHERE owner_id=$1`, [owner]);
    if (created) await client.query(`DROP DATABASE "${destination}"`);
    await client.end();
  }
}
main().catch(() => {
  console.error(
    'Recovery drill failed; only use a migrated dedicated test database and PostgreSQL 17 tools.',
  );
  process.exitCode = 1;
});
