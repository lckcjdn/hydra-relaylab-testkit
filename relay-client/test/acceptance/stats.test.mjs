import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../../bin/relay.mjs';

test('D: stats prints counts by ticket status', async () => {
  const lines=[];
  const fakeFetch=async url => {
    assert.match(url,/\/tickets$/);
    return new Response(JSON.stringify({tickets:[
      {status:'open'}, {status:'open'}, {status:'in_progress'}, {status:'closed'}
    ]}),{status:200,headers:{'content-type':'application/json'}});
  };
  assert.equal(await run(['stats'],{out:s=>lines.push(s),err:()=>{}},fakeFetch),0);
  assert.deepEqual(lines,['open: 2','in_progress: 1','closed: 1']);
});
