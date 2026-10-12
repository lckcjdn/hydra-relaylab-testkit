import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../helpers.mjs';

test('C: CSV export uses stable columns and safe quoting', async t => {
  const f = await fixture(t);
  await f.call('POST','/tickets',{title:'Alpha, "urgent"',priority:'high'});
  await f.call('POST','/tickets',{title:'Second',priority:'normal'});
  const result = await f.call('GET','/tickets/export.csv');
  assert.equal(result.status,200);
  assert.match(result.type,/text\/csv/);
  const lines = result.body.trim().split(/\r?\n/);
  assert.equal(lines[0],'id,title,priority,status,createdAt,updatedAt');
  assert.match(lines[1],/^T-0001,"Alpha, ""urgent""",high,open,/);
  assert.match(lines[2],/^T-0002,Second,normal,open,/);
});
