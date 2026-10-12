import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../../bin/relay.mjs';

test('D: export writes the exact API CSV response into --output', async t => {
  const dir=mkdtempSync(join(tmpdir(),'relay-client-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const out=join(dir,'tickets.csv');
  const csv='id,title,priority,status,createdAt,updatedAt\r\nT-0001,Test,high,open,x,x\r\n';
  const fakeFetch=async url => {
    assert.match(url,/\/tickets\/export\.csv$/);
    return new Response(csv,{status:200,headers:{'content-type':'text/csv'}});
  };
  const lines=[];
  assert.equal(await run(['export','--output',out],{out:s=>lines.push(s),err:()=>{}},fakeFetch),0);
  assert.equal(readFileSync(out,'utf8'),csv);
});
