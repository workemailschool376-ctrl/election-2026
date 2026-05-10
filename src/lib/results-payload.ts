import { prisma } from "@/lib/prisma";

export async function getDashboardResultsPayload() {
  const [elections, houses] = await Promise.all([
    prisma.election.findMany({
      include: {
        candidates: {
          include: { house: true },
          orderBy: [{ role: "asc" }, { votes: "desc" }, { name: "asc" }],
        },
      },
      orderBy: { id: "asc" },
    }),
    prisma.house.findMany({
      include: {
        candidates: {
          include: { election: true },
          where: { election: { type: "HOUSE" } },
          orderBy: [{ role: "asc" }, { votes: "desc" }, { name: "asc" }],
        },
      },
      orderBy: { id: "asc" },
    }),
  ]);

  return { elections, houses };
}
