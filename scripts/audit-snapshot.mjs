// Read-only sanity checker for Hydra orchestration.json / orchestration-events.jsonl.
// No network requests. Never prints full user prompts, cwd or secrets.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const opt=(key)=>{const i=process.argv.indexOf(key);return i<0?null:process.argv[i+1]};
const stateFile=opt('--state');
if(!stateFile){ console.error('Usage: node scripts/audit-snapshot.mjs --state PATH_TO_orchestration.json [--events PATH_TO_orchestration-events.jsonl]');process.exit(2); }
const errors=[],warnings=[];
const state=JSON.parse(readFileSync(resolve(stateFile),'utf8'));
const groups=state.groups||[],sessions=state.sessions||[],tasks=state.tasks||[],handoffs=state.handoffs||[];
const bySession=new Map(sessions.map(s=>[s.id,s]));
const byTask=new Map(tasks.map(t=>[t.id,t]));
const seen=new Set();
for(const s of sessions){
 if(seen.has(s.id)) errors.push('duplicate Hydra session id');seen.add(s.id);
 if(s.groupId&&!groups.some(g=>g.id===s.groupId))errors.push('session references non-existent group');
}
for(const g of groups){
 if(g.managerSessionId&&!g.sessionIds.includes(g.managerSessionId))errors.push('manager not in group membership');
 if(new Set(g.sessionIds).size!==g.sessionIds.length)errors.push('duplicate group member');
 for(const id of g.sessionIds){
   if(!bySession.has(id))errors.push('dangling group session reference');
   else if(bySession.get(id).groupId!==g.id)errors.push('group ownership mismatch');
 }
}
for(const t of tasks){
 if(!groups.some(g=>g.id===t.groupId))errors.push('task references unknown group');
 if(t.assigneeSessionId){const s=bySession.get(t.assigneeSessionId);
   if(!s||s.groupId!==t.groupId)errors.push('task assigned outside group');
 }
}
for(const h of handoffs){
 if(!byTask.has(h.taskId))errors.push('handoff references missing task');
 if(!bySession.has(h.fromSessionId))errors.push('handoff missing original session');
 if(h.toSessionId && h.fromSessionId===h.toSessionId)errors.push('handoff to same session');
 if(h.toSessionId && !bySession.has(h.toSessionId))errors.push('handoff missing successor session');
}
for(const s of sessions){
 if(s.lifecycle==='resume_pending')warnings.push('resume_pending is NOT proof that native Harness resumed');
 if(!s.quotaPoolId)warnings.push('a session lacks quotaPoolId; quota freeze may not apply');
}
const dupNative=new Map();
for(const s of sessions){if(!s.nativeSessionId)continue;const key=[s.provider,s.nativeSessionId,s.cwd].join('::');dupNative.set(key,(dupNative.get(key)||0)+1);}
if([...dupNative.values()].some(x=>x>1))warnings.push('duplicate native provider session records; check exclusive resume locks');
const eventPath=opt('--events');let numEvents=null;
if(eventPath){
 if(!existsSync(eventPath))errors.push('events file does not exist');
 else {
  const events=readFileSync(eventPath,'utf8').split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x));
  numEvents=events.length;const ids=new Set();let prev=0;
  for(const e of events){if(ids.has(e.eventId))errors.push('duplicate eventId');ids.add(e.eventId);
   if(!Number.isInteger(e.sequence)||e.sequence<=prev)errors.push('non-monotonic sequence');prev=e.sequence;}
 }
}
console.log(JSON.stringify({ok:errors.length===0,counts:{groups:groups.length,sessions:sessions.length,tasks:tasks.length,handoffs:handoffs.length,events:numEvents},errors,warnings:[...new Set(warnings)]},null,2));
if(errors.length)process.exitCode=1;
