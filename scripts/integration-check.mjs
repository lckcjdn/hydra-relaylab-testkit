// Cross-repo integration, only expected to pass AFTER tasks A-D have been implemented.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { createStore } from '../relay-api/src/storage.mjs';
import { makeApp } from '../relay-api/src/server.mjs';
import { run } from '../relay-client/bin/relay.mjs';
const dir=mkdtempSync(join(tmpdir(),'hydra-integration-'));
const app=makeApp(createStore(join(dir,'db.json')));
await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${app.address().port}`;
try {
  const lines=[];const io={out:s=>lines.push(s),err:s=>lines.push('ERROR:'+s)};
  assert.equal(await run(['create','--url',url,'--title','Incident A','--priority','high'],io),0);
  assert.equal(await run(['create','--url',url,'--title','Incident B'],io),0);
  const listing=await fetch(url+'/tickets?priority=high');
  assert.equal((await listing.json()).tickets.length,1);
  assert.equal(await run(['stats','--url',url],io),0);
  assert.deepEqual(lines.slice(-3),['open: 2','in_progress: 0','closed: 0']);
  const csvPath=join(dir,'tickets.csv');
  assert.equal(await run(['export','--url',url,'--output',csvPath],io),0);
  assert.match(readFileSync(csvPath,'utf8'),/^id,title,priority,status,createdAt,updatedAt/);
  console.log('PASS: cross-repository HTTP + CLI integration');
} finally {
  await new Promise(resolve=>app.close(resolve));
  rmSync(dir,{recursive:true,force:true});
}
