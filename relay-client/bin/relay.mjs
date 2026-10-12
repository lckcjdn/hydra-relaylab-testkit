#!/usr/bin/env node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';

export async function run(args, io = { out: console.log, err: console.error }, fetchFn = fetch) {
  const getFlag = (name, fallback) => {
    const at = args.indexOf(name);
    return at >= 0 ? args[at + 1] : fallback;
  };
  const command = args[0] || 'help';
  const base = getFlag('--url', process.env.RELAY_URL || 'http://127.0.0.1:4500');
  if (command === 'help' || command === '--help') {
    io.out('Usage: relay <list|create|stats|export> [--url URL] [flags]');
    return 0;
  }
  if (command === 'list') {
    const res = await fetchFn(`${base}/tickets`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const t of data.tickets) io.out(`${t.id} ${t.status} ${t.title}`);
    return 0;
  }
  if (command === 'create') {
    const title = getFlag('--title');
    const priority = getFlag('--priority','normal');
    if (!title) throw new Error('--title is required');
    const res = await fetchFn(`${base}/tickets`,{
      method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title,priority})
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    io.out((await res.json()).id);
    return 0;
  }
  // WORKSTREAM D: stats and export.
  if (command === 'stats') {
    const res = await fetchFn(`${base}/tickets`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const counts = { open: 0, in_progress: 0, closed: 0 };
    for (const t of data.tickets) {
      if (Object.prototype.hasOwnProperty.call(counts, t.status)) counts[t.status] += 1;
    }
    io.out(`open: ${counts.open}`);
    io.out(`in_progress: ${counts.in_progress}`);
    io.out(`closed: ${counts.closed}`);
    return 0;
  }
  if (command === 'export') {
    const output = getFlag('--output');
    if (!output) throw new Error('--output is required');
    const res = await fetchFn(`${base}/tickets/export.csv`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    await writeFile(output, text, 'utf8');
    return 0;
  }
  throw new Error(`Unknown command: ${command}`);
}
const asScript = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (asScript) {
  run(process.argv.slice(2)).then(code => { process.exitCode=code; }).catch(error => {
    console.error(error.message);process.exitCode=1;
  });
}
