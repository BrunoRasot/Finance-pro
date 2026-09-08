import { spawn } from 'node:child_process';

async function apiIsRunning() {
  try {
    const response = await fetch('http://127.0.0.1:3001/api/v1/health/live', {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

if (await apiIsRunning()) {
  console.log(
    'La API ya está ejecutándose. Usa esa misma instancia para web y móvil; ahora ejecuta pnpm dev:mobile.',
  );
  process.exit(0);
}

const child = spawn(
  process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'pnpm',
  process.platform === 'win32'
    ? ['/d', '/s', '/c', 'pnpm.cmd --filter @finance-pro/api run dev']
    : ['--filter', '@finance-pro/api', 'run', 'dev'],
  {
    cwd: new URL('..', import.meta.url),
    stdio: 'inherit',
    env: { ...process.env, HOST: '0.0.0.0' },
  },
);

for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => child.kill(signal));
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
