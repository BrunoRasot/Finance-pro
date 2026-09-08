import { spawn, spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url);
const children = new Set();
let stopping = false;

function runPnpm(args, extraEnv = {}) {
  const child =
    process.platform === 'win32'
      ? spawn(
          process.env.ComSpec ?? 'cmd.exe',
          ['/d', '/s', '/c', `pnpm.cmd ${args.join(' ')}`],
          {
            cwd: root,
            stdio: 'inherit',
            env: { ...process.env, ...extraEnv },
          },
        )
      : spawn('pnpm', args, {
          cwd: root,
          stdio: 'inherit',
          env: { ...process.env, ...extraEnv },
        });
  children.add(child);
  child.once('exit', (code) => {
    children.delete(child);
    if (!stopping) shutdown(code ?? 1);
  });
  return child;
}

function stopTree(child) {
  if (!child.pid) return;
  if (process.platform === 'win32')
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
    });
  else child.kill('SIGTERM');
}

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) stopTree(child);
  process.exit(code);
}

async function available(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(700) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApi(child) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error('La API terminó durante el arranque.');
    if (await available('http://127.0.0.1:3001/api/v1/health/live')) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('La API no respondió en 30 segundos.');
}

process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));

if (
  (await available('http://127.0.0.1:3001/api/v1/health/live')) ||
  (await available('http://127.0.0.1:3000'))
) {
  console.error(
    'Los puertos 3000 o 3001 ya están en uso. Cierra los servidores anteriores y vuelve a ejecutar pnpm dev.',
  );
  process.exit(1);
}

try {
  const api = runPnpm(['--filter', '@finance-pro/api', 'run', 'dev'], {
    HOST: '0.0.0.0',
  });
  await waitForApi(api);
  console.log('\nAPI lista. Iniciando la aplicación web...\n');
  runPnpm(['--filter', '@finance-pro/web', 'run', 'dev']);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'No se pudo iniciar el entorno.',
  );
  shutdown(1);
}
