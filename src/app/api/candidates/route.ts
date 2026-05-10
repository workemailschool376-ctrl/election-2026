import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { broadcast } from "@/lib/sse-broadcaster";
import { getDashboardResultsPayload } from "@/lib/results-payload";
import { ELECTION_TYPES, isRoleValidForElectionType } from "@/lib/election-meta";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      include: { house: true, election: true },
      orderBy: { createdAt: "asc" },
    });
    return Response.json({ candidates });
  } catch (error) {
    console.error("[GET /api/candidates]", error);
    return Response.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await validateSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, symbolName, imageUrl, role, electionId, houseId, imageBase64 } = body;
    const parsedElectionId = Number(electionId);
    const parsedHouseId = houseId ? Number(houseId) : null;

    if (!name || !role || !parsedElectionId || Number.isNaN(parsedElectionId)) {
      return Response.json(
        { error: "name, role, electionId are required" },
        { status: 400 }
      );
    }

    const election = await prisma.election.findUnique({
      where: { id: parsedElectionId },
      select: { id: true, type: true },
    });
    if (!election) {
      return Response.json({ error: "Election not found" }, { status: 404 });
    }
    if (!isRoleValidForElectionType(role, election.type)) {
      return Response.json(
        { error: `Role ${role} is invalid for ${election.type} election` },
        { status: 400 }
      );
    }
    if (election.type === ELECTION_TYPES.HOUSE && !parsedHouseId) {
      return Response.json(
        { error: "houseId is required for house election candidates" },
        { status: 400 }
      );
    }
    if (
      parsedHouseId !== null &&
      (Number.isNaN(parsedHouseId) || !Number.isInteger(parsedHouseId))
    ) {
      return Response.json({ error: "houseId is invalid" }, { status: 400 });
    }

    let imageBytes: Buffer | null = null;
    if (typeof imageBase64 === "string" && imageBase64.trim().length > 0) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      imageBytes = Buffer.from(base64Data, "base64");
    }
    let candidate = await prisma.candidate.create({
      data: {
        name,
        symbolName: symbolName ?? "",
        imageUrl: imageUrl || "/candidates/default.svg",
        imageBytes,
        role,
        electionId: parsedElectionId,
        houseId: parsedHouseId,
        votes: 0,
      },
      include: { house: true, election: true },
    });

    if (imageBytes) {
      candidate = await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          imageUrl: `/api/candidates/${candidate.id}/image?v=${Date.now()}`,
        },
        include: { house: true, election: true },
      });
    }
    const payload = await getDashboardResultsPayload();
    broadcast(payload);

    return Response.json({ candidate }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/candidates]", error);
    return Response.json({ error: "Failed to create candidate" }, { status: 500 });
  }
}
