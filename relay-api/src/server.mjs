import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createStore } from './storage.mjs';

function send(res, code, data, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'content-type': type });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}
async function bodyAsJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk.toString('utf8');
    if (body.length > 64_000) throw new TypeError('body too large');
  }
  try { return JSON.parse(body || '{}'); } catch { throw new TypeError('invalid JSON'); }
}

export function makeApp(store) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const idMatch = url.pathname.match(/^\/tickets\/(T-\d+)$/);
    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        return send(res, 200, { ok: true, service: 'relay-api' });
      }
      if (req.method === 'GET' && url.pathname === '/tickets') {
        // WORKSTREAM A: support status/priority filters, pagination, strict input validation.
        return send(res, 200, { tickets: store.list() });
      }
      if (req.method === 'POST' && url.pathname === '/tickets') {
        return send(res, 201, store.create(await bodyAsJson(req)));
      }
      if (idMatch && req.method === 'GET') {
        const ticket = store.get(idMatch[1]);
        return ticket ? send(res, 200, ticket) : send(res, 404, { error: 'ticket not found' });
      }
      if (idMatch && req.method === 'PATCH') {
        // WORKSTREAM B: durable per-ticket audit history and actor.
        const ticket = store.updateStatus(idMatch[1], await bodyAsJson(req));
        return ticket ? send(res, 200, ticket) : send(res, 404, { error: 'ticket not found' });
      }
      // WORKSTREAM C: GET /tickets/export.csv, RFC4180-style escaping.
      return send(res, 404, { error: 'route not found' });
    } catch (e) {
      if (e instanceof TypeError) return send(res, 400, { error: e.message });
      return send(res, 500, { error: 'internal error' });
    }
  });
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const filePath = process.env.RELAY_DATA_FILE || resolve('data/tickets.json');
  const port = Number(process.env.PORT || 4500);
  const server = makeApp(createStore(filePath));
  server.listen(port, '127.0.0.1', () => console.log(`relay-api listening on http://127.0.0.1:${port}`));
}
