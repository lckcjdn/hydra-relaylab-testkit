import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mode=process.argv[2] || 'baseline';
if (!['baseline','acceptance','all'].includes(mode)) {
  console.error('Usage: node scripts/measure.mjs baseline|acceptance|all');process.exit(2);
}
const key=mode==='baseline'?'test':mode==='acceptance'?'test:acceptance':'test:all';
const output={mode,ranAt:new Date().toISOString(),node:process.version,results:[]};
for(const project of ['relay-api','relay-client']){
 const cwd=resolve(root,project);
 const res=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run',key],{
   cwd,encoding:'utf8',shell:process.platform==='win32',maxBuffer:5*1024*1024
 });
 const stdout=(res.stdout||'')+'\n'+(res.stderr||'');
 // Node 20-23 TAP summary uses `# pass N`; Node 24 uses `ℹ pass N`.
 const match=stdout.match(/(?:#|ℹ) pass (\d+)/);const fails=stdout.match(/(?:#|ℹ) fail (\d+)/);
 const item={project,exitCode:res.status,pass:match?Number(match[1]):null,fail:fails?Number(fails[1]):null,
   output:stdout.slice(-10000),error:res.error?.message||null};
 output.results.push(item);
 console.log(`\n[${project}] exit=${item.exitCode} pass=${item.pass} fail=${item.fail}`);
}
const outdir=resolve(root,'reports');mkdirSync(outdir,{recursive:true});
const outfile=resolve(outdir,`measurement-${mode}.json`);
writeFileSync(outfile,JSON.stringify(output,null,2)+'\n','utf8');
console.log(`Report: ${outfile}`);
if(output.results.some(x=>x.exitCode!==0))process.exitCode=1;
