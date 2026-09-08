import { spawnSync } from 'node:child_process';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

const action = process.argv[2];
const target = resolve(process.argv[3] ?? '../../backups/encrypted');
const password = process.env.BACKUP_ENCRYPTION_KEY;
if (!password || password.length < 32) {
  throw new Error('BACKUP_ENCRYPTION_KEY must contain at least 32 characters');
}

const magic = Buffer.from('FPBK1');

async function encrypt(input, output) {
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const key = scryptSync(password, salt, 32);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  try {
    await writeFile(output, Buffer.concat([magic, salt, nonce]), {
      flag: 'wx',
    });
    await pipeline(
      createReadStream(input),
      cipher,
      createWriteStream(output, { flags: 'a' }),
    );
    await writeFile(output, cipher.getAuthTag(), { flag: 'a' });
  } catch (error) {
    await unlink(output).catch(() => undefined);
    throw error;
  }
}

async function decrypt(input, output) {
  const headerSize = magic.length + 16 + 12;
  const size = (await stat(input)).size;
  if (size <= headerSize + 16) throw new Error('Invalid encrypted backup size');
  const handle = await open(input, 'r');
  const header = Buffer.alloc(headerSize);
  const tag = Buffer.alloc(16);
  try {
    await handle.read(header, 0, header.length, 0);
    await handle.read(tag, 0, tag.length, size - tag.length);
  } finally {
    await handle.close();
  }
  if (!header.subarray(0, magic.length).equals(magic)) {
    throw new Error('Invalid Finance Pro encrypted backup');
  }
  const saltStart = magic.length;
  const nonceStart = saltStart + 16;
  const bodyStart = nonceStart + 12;
  const key = scryptSync(password, header.subarray(saltStart, nonceStart), 32);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    header.subarray(nonceStart, bodyStart),
  );
  decipher.setAuthTag(tag);
  try {
    await pipeline(
      createReadStream(input, { start: bodyStart, end: size - tag.length - 1 }),
      decipher,
      createWriteStream(output, { flags: 'wx' }),
    );
  } catch (error) {
    await unlink(output).catch(() => undefined);
    throw error;
  }
}

if (action === 'create') {
  await mkdir(target, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(':', '-');
  const plain = resolve(target, `finance-pro-${stamp}.dump`);
  const manifest = `${plain}.json`;
  const result = spawnSync(
    process.execPath,
    ['scripts/backup.mjs', 'create', plain],
    {
      cwd: resolve(import.meta.dirname, '..'),
      stdio: 'inherit',
      env: process.env,
    },
  );
  if (result.status !== 0) throw new Error('Database backup failed');
  await encrypt(plain, `${plain}.enc`);
  await encrypt(manifest, `${manifest}.enc`);
  await Promise.all([unlink(plain), unlink(manifest)]);
  console.log(`Encrypted backup created: ${basename(plain)}.enc`);
} else if (action === 'encrypt') {
  const output = process.argv[4];
  if (!output) throw new Error('Use encrypt INPUT OUTPUT');
  await encrypt(target, resolve(output));
  console.log('Backup file encrypted');
} else if (action === 'decrypt') {
  const output = process.argv[4];
  if (!output) throw new Error('Use decrypt INPUT OUTPUT');
  await decrypt(target, resolve(output));
  console.log('Encrypted backup decrypted');
} else {
  throw new Error(
    'Use create DIRECTORY, encrypt INPUT OUTPUT or decrypt INPUT OUTPUT',
  );
}
