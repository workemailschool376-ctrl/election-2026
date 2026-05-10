/**
 * In-memory SSE broadcaster.
 * When votes change, call broadcast() to push fresh data to all connected clients.
 * Each client registers a controller when they connect to /api/sse.
 */

type Controller = ReadableStreamDefaultController<Uint8Array>;

const clients = new Set<Controller>();
const encoder = new TextEncoder();

export function addClient(controller: Controller) {
  clients.add(controller);
}

export function removeClient(controller: Controller) {
  clients.delete(controller);
}

export function broadcast(data: object) {
  const message = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const controller of clients) {
    try {
      controller.enqueue(message);
    } catch {
      // Client disconnected mid-write; remove it
      clients.delete(controller);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
