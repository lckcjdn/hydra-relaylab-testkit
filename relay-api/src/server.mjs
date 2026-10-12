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

// RFC4180-style CSV field escaping (comma/quote/newline trigger quoting).
function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parsePagination(url) {
  const rawLimit = url.searchParams.get('limit');
  const rawOffset = url.searchParams.get('offset');
  let limit;
  let offset;
  if (rawLimit !== null) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 0) throw new TypeError('invalid limit');
  }
  if (rawOffset !== null) {
    offset = Number(rawOffset);
    if (!Number.isInteger(offset) || offset < 0) throw new TypeError('invalid offset');
  }
  return { limit, offset };
}

export function makeApp(store) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const idMatch = url.pathname.match(/^\/tickets\/(T-\d+)$/);
    const historyMatch = url.pathname.match(/^\/tickets\/(T-\d+)\/history$/);
    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        return send(res, 200, { ok: true, service: 'relay-api' });
      }
      if (req.method === 'GET' && url.pathname === '/tickets') {
        // WORKSTREAM A: status/priority filters, pagination, strict input validation.
        const status = url.searchParams.get('status');
        const priority = url.searchParams.get('priority');
        const { limit, offset } = parsePagination(url);

        let tickets = store.list(); // stable creation order
        if (status) tickets = tickets.filter((t) => t.status === status);
        if (priority) tickets = tickets.filter((t) => t.priority === priority);
        const total = tickets.length;
        if (offset !== undefined && limit !== undefined) {
          tickets = tickets.slice(offset, offset + limit);
        } else if (offset !== undefined) {
          tickets = tickets.slice(offset);
        } else if (limit !== undefined) {
          tickets = tickets.slice(0, limit);
        }
        return send(res, 200, { tickets, total });
      }
      if (req.method === 'POST' && url.pathname === '/tickets') {
        return send(res, 201, store.create(await bodyAsJson(req)));
      }
      // WORKSTREAM C: CSV export. Must be routed before the dynamic /tickets/:id route.
      if (req.method === 'GET' && url.pathname === '/tickets/export.csv') {
        const header = ['id', 'title', 'priority', 'status', 'createdAt', 'updatedAt'];
        const rows = store.list().map((t) =>
          [t.id, t.title, t.priority, t.status, t.createdAt, t.updatedAt].map(csvCell).join(',')
        );
        const csv = [header.join(','), ...rows].join('\r\n') + '\r\n';
        return send(res, 200, csv, 'text/csv; charset=utf-8');
      }
      // WORKSTREAM B: durable per-ticket audit history.
      if (historyMatch && req.method === 'GET') {
        const ticket = store.get(historyMatch[1]);
        return ticket ? send(res, 200, { history: ticket.history ?? [] }) : send(res, 404, { error: 'ticket not found' });
      }
      if (idMatch && req.method === 'GET') {
        const ticket = store.get(idMatch[1]);
        return ticket ? send(res, 200, ticket) : send(res, 404, { error: 'ticket not found' });
      }
      if (idMatch && req.method === 'PATCH') {
        const ticket = store.updateStatus(idMatch[1], await bodyAsJson(req));
        return ticket ? send(res, 200, ticket) : send(res, 404, { error: 'ticket not found' });
      }
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
