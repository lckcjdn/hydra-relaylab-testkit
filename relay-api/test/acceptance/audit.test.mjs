import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../src/storage.mjs';
import { fixture } from '../helpers.mjs';

test('B: auditable status transitions survive store reopen', async t => {
  const f = await fixture(t);
  await f.call('POST','/tickets',{title:'Audit',priority:'normal'});
  const result = await f.call('PATCH','/tickets/T-0001',{status:'in_progress',actor:'codex-worker'});
  assert.equal(result.status,200);
  const history = await f.call('GET','/tickets/T-0001/history');
  assert.equal(history.status,200);
  assert.deepEqual(history.body.history.map(e=>[e.from,e.to,e.actor]), [['open','in_progress','codex-worker']]);
  const persisted = createStore(f.path).get('T-0001');
  assert.equal(persisted.history.length,1);
  assert.equal(typeof persisted.history[0].at,'string');
});

test('B: nonexistent ticket has no history endpoint', async t => {
  const f = await fixture(t);
  assert.equal((await f.call('GET','/tickets/T-9999/history')).status,404);
});
