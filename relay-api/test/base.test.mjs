import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/storage.mjs';
import { fixture } from './helpers.mjs';

test('health and CRUD work without dependencies', async t => {
  const f = await fixture(t);
  assert.deepEqual((await f.call('GET','/health')).body, { ok:true, service:'relay-api' });
  const created = await f.call('POST','/tickets',{title:'Check API',priority:'high'});
  assert.equal(created.status,201);
  assert.equal(created.body.id,'T-0001');
  assert.equal((await f.call('GET','/tickets')).body.tickets.length,1);
  const patched = await f.call('PATCH','/tickets/T-0001',{status:'closed'});
  assert.equal(patched.body.status,'closed');
  assert.equal((await f.call('GET','/tickets/T-0001')).body.status,'closed');
  assert.equal(createStore(f.path).get('T-0001').status,'closed');
});

test('validation rejects bad input', async t => {
  const f = await fixture(t);
  assert.equal((await f.call('POST','/tickets',{title:''})).status,400);
  assert.equal((await f.call('POST','/tickets',{title:'x',priority:'urgent'})).status,400);
  assert.equal((await f.call('GET','/tickets/T-0999')).status,404);
});
