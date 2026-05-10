import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { broadcast } from "@/lib/sse-broadcaster";
import { getDashboardResultsPayload } from "@/lib/results-payload";

export async function POST() {
  if (!(await validateSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Reset all votes to 0
    await prisma.candidate.updateMany({ data: { votes: 0 } });

    // Broadcast reset
    const payload = await getDashboardResultsPayload();
    broadcast(payload);

    return Response.json({ success: true, message: "All votes reset to 0" });
  } catch (error) {
    console.error("[POST /api/reset]", error);
    return Response.json({ error: "Failed to reset votes" }, { status: 500 });
  }
}
