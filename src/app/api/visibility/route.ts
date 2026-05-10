import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { broadcast } from "@/lib/sse-broadcaster";
import { getDashboardResultsPayload } from "@/lib/results-payload";

export async function POST(request: Request) {
  if (!(await validateSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { electionId, isVisible } = body;

    if (electionId === undefined || isVisible === undefined) {
      return Response.json(
        { error: "electionId and isVisible are required" },
        { status: 400 }
      );
    }

    const election = await prisma.election.update({
      where: { id: Number(electionId) },
      data: { isVisible: Boolean(isVisible) },
    });

    // Broadcast visibility change
    const payload = await getDashboardResultsPayload();
    broadcast(payload);

    return Response.json({ election });
  } catch (error) {
    console.error("[POST /api/visibility]", error);
    return Response.json(
      { error: "Failed to update visibility" },
      { status: 500 }
    );
  }
}
