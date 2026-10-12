import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Tiny file-backed store: no external packages, deterministic IDs, atomic rename.
export function createStore(path, now = () => new Date().toISOString()) {
  function read() {
    if (!existsSync(path)) return { nextId: 1, tickets: [] };
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(data.tickets)) throw new Error('Invalid tickets database');
    return data;
  }
  function write(data) {
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    renameSync(tmp, path);
  }
  function list() { return read().tickets; }
  function get(id) { return read().tickets.find(t => t.id === id) ?? null; }
  function create({ title, priority = 'normal' }) {
    if (typeof title !== 'string' || !title.trim()) throw new TypeError('title is required');
    if (!['low', 'normal', 'high'].includes(priority)) throw new TypeError('invalid priority');
    const data = read();
    const timestamp = now();
    const ticket = {
      id: `T-${String(data.nextId).padStart(4, '0')}`,
      title: title.trim(), priority, status: 'open',
      createdAt: timestamp, updatedAt: timestamp
    };
    data.nextId += 1;
    data.tickets.push(ticket);
    write(data);
    return ticket;
  }
  function updateStatus(id, { status }) {
    if (!['open', 'in_progress', 'closed'].includes(status)) throw new TypeError('invalid status');
    const data = read();
    const ticket = data.tickets.find(t => t.id === id);
    if (!ticket) return null;
    ticket.status = status;
    ticket.updatedAt = now();
    write(data);
    return ticket;
  }
  return { read, list, get, create, updateStatus };
}
