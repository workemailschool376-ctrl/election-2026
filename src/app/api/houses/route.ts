import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { broadcast } from "@/lib/sse-broadcaster";
import { getDashboardResultsPayload } from "@/lib/results-payload";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const houses = await prisma.house.findMany({ orderBy: { id: "asc" } });
    return Response.json({ houses });
  } catch (error) {
    console.error("[GET /api/houses]", error);
    return Response.json({ error: "Failed to fetch houses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await validateSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return Response.json({ error: "name and color are required" }, { status: 400 });
    }

    const validColors = ["RED", "GREEN", "BLUE", "YELLOW"];
    if (!validColors.includes(color)) {
      return Response.json(
        { error: `color must be one of: ${validColors.join(", ")}` },
        { status: 400 }
      );
    }

    const house = await prisma.house.create({ data: { name, color } });
    const payload = await getDashboardResultsPayload();
    broadcast(payload);
    return Response.json({ house }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/houses]", error);
    return Response.json({ error: "Failed to create house" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await validateSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return Response.json({ error: "id and name are required" }, { status: 400 });
    }

    const house = await prisma.house.update({
      where: { id: Number(id) },
      data: { name },
    });
    const payload = await getDashboardResultsPayload();
    broadcast(payload);
    return Response.json({ house });
  } catch (error) {
    console.error("[PUT /api/houses]", error);
    return Response.json({ error: "Failed to update house" }, { status: 500 });
  }
}
