import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';

config({ path: '.env.test', quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) {
  throw new Error(
    'TEST_DATABASE_URL must reference a dedicated database ending in _test',
  );
}
const result = spawnSync(
  process.execPath,
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  },
);
process.exitCode = result.status ?? 1;
