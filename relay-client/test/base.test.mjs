import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../bin/relay.mjs';

test('client help', async () => {
  const messages=[];
  assert.equal(await run(['help'],{out:m=>messages.push(m),err:()=>{}}),0);
  assert.match(messages[0],/Usage/);
});

test('client list prints tickets', async () => {
  const messages=[];
  const fakeFetch=async () => new Response(JSON.stringify({tickets:[{id:'T-0001',status:'open',title:'Review'}]}),{status:200});
  assert.equal(await run(['list'],{out:m=>messages.push(m),err:()=>{}},fakeFetch),0);
  assert.equal(messages[0],'T-0001 open Review');
});
