import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const directory = process.env.BACKUP_DIRECTORY;
if (!directory) {
  console.error('BACKUP_DIRECTORY is required');
  process.exitCode = 1;
} else {
  const stamp = new Date().toISOString().replaceAll(':', '-');
  const file = resolve(directory, `finance-pro-${stamp}-${randomUUID()}.dump`);
  const result = spawnSync(
    process.execPath,
    ['scripts/backup.mjs', 'create', file],
    {
      stdio: 'inherit',
      env: process.env,
      windowsHide: true,
    },
  );
  process.exitCode = result.status ?? 1;
}
