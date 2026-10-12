import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../src/storage.mjs';
import { makeApp } from '../src/server.mjs';

export async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'hydra-relay-'));
  const path = join(dir, 'data.json');
  const store = createStore(path, () => '2026-10-12T00:00:00.000Z');
  const app = makeApp(store);
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.address().port}`;
  t.after(async () => { await new Promise(resolve => app.close(resolve)); rmSync(dir, {recursive:true,force:true}); });
  async function call(method, endpoint, payload) {
    const res = await fetch(base+endpoint, {
      method,
      headers: payload ? {'content-type':'application/json'} : {},
      body: payload ? JSON.stringify(payload) : undefined
    });
    const type = res.headers.get('content-type') || '';
    return { status: res.status, body: type.includes('json') ? await res.json() : await res.text(), type };
  }
  return { dir, path, store, app, base, call };
}
