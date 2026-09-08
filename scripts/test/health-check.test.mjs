import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { checkHealth } from '../health-check.mjs';

test('monitor detects readiness failures even when the web and process are alive', async () => {
  let ready = true;
  const server = createServer((req, res) => {
    if (req.url === '/iniciar-sesion')
      return res.end('<title>Finance Pro</title>');
    const healthy = req.url.endsWith('/live') || ready;
    res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: healthy ? 'ok' : 'error' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await checkHealth(`${origin}/api/v1`, origin)).ok, true);
    ready = false;
    const result = await checkHealth(`${origin}/api/v1`, origin);
    assert.equal(result.ok, false);
    assert.equal(
      result.results.find((item) => item.service === 'api-ready').status,
      503,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('monitor rejects plaintext public destinations and credentials', async () => {
  const result = await checkHealth(
    'http://example.com/api/v1',
    'https://user:secret@example.com',
  );
  assert.equal(result.ok, false);
  assert.ok(result.results.every((item) => item.ok === false));
  assert.ok(!JSON.stringify(result).includes('secret'));
});
