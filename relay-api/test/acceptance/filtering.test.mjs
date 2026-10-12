import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../helpers.mjs';

test('A: filter status+priority and paginate stably', async t => {
  const f = await fixture(t);
  await f.call('POST','/tickets',{title:'A',priority:'high'});
  await f.call('POST','/tickets',{title:'B',priority:'low'});
  await f.call('POST','/tickets',{title:'C',priority:'high'});
  await f.call('PATCH','/tickets/T-0003',{status:'closed'});
  const filtered = await f.call('GET','/tickets?status=open&priority=high');
  assert.equal(filtered.status,200);
  assert.deepEqual(filtered.body.tickets.map(x=>x.title),['A']);
  const page = await f.call('GET','/tickets?limit=1&offset=1');
  assert.equal(page.status,200);
  assert.deepEqual(page.body.tickets.map(x=>x.id),['T-0002']);
  assert.equal(page.body.total,3);
});

test('A: invalid pagination is 400, not silently ignored', async t => {
  const f = await fixture(t);
  assert.equal((await f.call('GET','/tickets?limit=-1')).status,400);
  assert.equal((await f.call('GET','/tickets?offset=NaN')).status,400);
});
