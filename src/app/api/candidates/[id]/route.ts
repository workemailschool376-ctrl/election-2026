import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { broadcast } from "@/lib/sse-broadcaster";
import { getDashboardResultsPayload } from "@/lib/results-payload";
import { ELECTION_TYPES, isRoleValidForElectionType } from "@/lib/election-meta";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await validateSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const candidateId = Number(id);
  if (!candidateId || Number.isNaN(candidateId)) {
    return Response.json({ error: "Invalid candidate id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, symbolName, imageUrl, role, electionId, houseId, imageBase64 } = body;
    const currentCandidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { election: true },
    });
    if (!currentCandidate) {
      return Response.json({ error: "Candidate not found" }, { status: 404 });
    }

    const parsedElectionId =
      electionId !== undefined ? Number(electionId) : currentCandidate.electionId;
    if (!parsedElectionId || Number.isNaN(parsedElectionId)) {
      return Response.json({ error: "Invalid electionId" }, { status: 400 });
    }
    const effectiveRole = role ?? currentCandidate.role;
    const parsedHouseId =
      houseId !== undefined
        ? houseId
          ? Number(houseId)
          : null
        : currentCandidate.houseId;
    if (
      parsedHouseId !== null &&
      parsedHouseId !== undefined &&
      (Number.isNaN(parsedHouseId) || !Number.isInteger(parsedHouseId))
    ) {
      return Response.json({ error: "houseId is invalid" }, { status: 400 });
    }

    const election = await prisma.election.findUnique({
      where: { id: parsedElectionId },
      select: { id: true, type: true },
    });
    if (!election) {
      return Response.json({ error: "Election not found" }, { status: 404 });
    }
    if (!isRoleValidForElectionType(effectiveRole, election.type)) {
      return Response.json(
        { error: `Role ${effectiveRole} is invalid for ${election.type} election` },
        { status: 400 }
      );
    }
    if (election.type === ELECTION_TYPES.HOUSE && !parsedHouseId) {
      return Response.json(
        { error: "houseId is required for house election candidates" },
        { status: 400 }
      );
    }

    let imageBytes: Buffer | undefined = undefined;
    if (typeof imageBase64 === "string" && imageBase64.trim().length > 0) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      imageBytes = Buffer.from(base64Data, "base64");
    }
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (symbolName !== undefined) data.symbolName = symbolName;
    if (role !== undefined) data.role = role;
    if (electionId !== undefined) data.electionId = parsedElectionId;
    if (houseId !== undefined) data.houseId = parsedHouseId;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || "/candidates/default.svg";
    if (imageBytes !== undefined) {
      data.imageBytes = imageBytes;
      data.imageUrl = `/api/candidates/${candidateId}/image?v=${Date.now()}`;
    }

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data,
      include: { house: true, election: true },
    });
    const payload = await getDashboardResultsPayload();
    broadcast(payload);

    return Response.json({ candidate });
  } catch (error) {
    console.error("[PUT /api/candidates/[id]]", error);
    return Response.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await validateSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.candidate.delete({ where: { id: Number(id) } });

    // Broadcast updated data after deletion
    const payload = await getDashboardResultsPayload();
    broadcast(payload);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/candidates/[id]]", error);
    return Response.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}
