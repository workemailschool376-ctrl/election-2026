import { addClient, removeClient } from "@/lib/sse-broadcaster";
import { getDashboardResultsPayload } from "@/lib/results-payload";

export const dynamic = "force-dynamic";

async function fetchResults() {
  return getDashboardResultsPayload();
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      addClient(controller);

      // Send initial data immediately
      try {
        const data = await fetchResults();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      } catch (e) {
        console.error("[SSE] initial fetch error", e);
      }

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Clean up on disconnect
      return () => {
        clearInterval(heartbeat);
        removeClient(controller);
      };
    },
    cancel(controller) {
      removeClient(controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
