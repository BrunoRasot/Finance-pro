import { pathToFileURL } from 'node:url';

export async function checkHealth(apiBase, webOrigin) {
  const endpoints = [
    ['api-live', `${apiBase}/health/live`, true],
    ['api-ready', `${apiBase}/health/ready`, true],
    ['web-login', `${webOrigin}/iniciar-sesion`, false],
  ];
  const results = await Promise.all(
    endpoints.map(async ([service, address, json]) => {
      const started = performance.now();
      try {
        const url = new URL(address);
        const local = ['127.0.0.1', 'localhost', '[::1]'].includes(
          url.hostname,
        );
        if (
          url.username ||
          url.password ||
          url.search ||
          url.hash ||
          (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
        )
          throw new Error('Unsafe monitor URL');
        const response = await fetch(url, {
          redirect: 'error',
          signal: AbortSignal.timeout(10000),
          cache: 'no-store',
        });
        const ok =
          response.status === 200 &&
          (json
            ? (await response.json()).status === 'ok'
            : (await response.text()).includes('Finance Pro'));
        return {
          service,
          ok,
          status: response.status,
          durationMs: Math.round(performance.now() - started),
        };
      } catch {
        return {
          service,
          ok: false,
          durationMs: Math.round(performance.now() - started),
        };
      }
    }),
  );
  return { ok: results.every((result) => result.ok), results };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { MONITOR_API_BASE_URL, MONITOR_WEB_ORIGIN } = process.env;
  if (!MONITOR_API_BASE_URL || !MONITOR_WEB_ORIGIN) {
    console.error('Set MONITOR_API_BASE_URL and MONITOR_WEB_ORIGIN');
    process.exitCode = 1;
  } else {
    const result = await checkHealth(
      MONITOR_API_BASE_URL.replace(/\/$/, ''),
      MONITOR_WEB_ORIGIN.replace(/\/$/, ''),
    );
    console.log(JSON.stringify(result));
    process.exitCode = result.ok ? 0 : 1;
  }
}
