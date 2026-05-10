import { getDashboardResultsPayload } from "@/lib/results-payload";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getDashboardResultsPayload();
    return Response.json(payload);
  } catch (error) {
    console.error("[/api/results]", error);
    return Response.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
