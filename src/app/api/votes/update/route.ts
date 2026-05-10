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
    const { candidateId, delta, absoluteVotes } = body;
    const parsedCandidateId = Number(candidateId);

    if (!parsedCandidateId || Number.isNaN(parsedCandidateId)) {
      return Response.json({ error: "candidateId required" }, { status: 400 });
    }

    let candidate;

    if (typeof absoluteVotes === "number") {
      if (absoluteVotes < 0) {
        return Response.json({ error: "votes cannot be negative" }, { status: 400 });
      }
      candidate = await prisma.candidate.update({
        where: { id: parsedCandidateId },
        data: { votes: absoluteVotes },
        include: { house: true, election: true },
      });
    } else if (typeof delta === "number") {
      const current = await prisma.candidate.findUnique({
        where: { id: parsedCandidateId },
      });
      if (!current) {
        return Response.json({ error: "Candidate not found" }, { status: 404 });
      }
      const newVotes = Math.max(0, current.votes + delta);
      candidate = await prisma.candidate.update({
        where: { id: parsedCandidateId },
        data: { votes: newVotes },
        include: { house: true, election: true },
      });
    } else {
      return Response.json(
        { error: "Provide either delta or absoluteVotes" },
        { status: 400 }
      );
    }

    // Push updated results to all SSE clients
    const payload = await getDashboardResultsPayload();
    broadcast(payload);

    return Response.json({ candidate });
  } catch (error) {
    console.error("[/api/votes/update]", error);
    return Response.json({ error: "Failed to update votes" }, { status: 500 });
  }
}
