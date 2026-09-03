import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const rootEnv = new URL('.env', root);
const content = existsSync(rootEnv) ? readFileSync(rootEnv, 'utf8') : '';
let password = content.match(/^POSTGRES_PASSWORD=([A-Za-z0-9_-]+)\r?$/m)?.[1];
if (!password) {
  if (/^POSTGRES_PASSWORD=/m.test(content)) {
    throw new Error(
      'Existing POSTGRES_PASSWORD needs manual review; no files changed.',
    );
  }
  password = randomBytes(24).toString('hex');
  appendFileSync(rootEnv, `\nPOSTGRES_PASSWORD=${password}\n`);
}
for (const [path, variable, database] of [
  ['apps/api/.env', 'DATABASE_URL', 'finance_pro'],
  ['apps/api/.env.test', 'TEST_DATABASE_URL', 'finance_pro_test'],
]) {
  const target = new URL(path, root);
  const existing = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (!new RegExp(`^${variable}=`, 'm').test(existing)) {
    appendFileSync(
      target,
      `\n${variable}=postgresql://finance_pro:${password}@127.0.0.1:5433/${database}\n`,
    );
  }
}
console.log(
  `Local database configuration prepared in ${fileURLToPath(root)}. Secrets were not printed.`,
);
