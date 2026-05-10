import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "file:./dev.db",
      },
    },
  });

  try {
    const sessions = await prisma.adminSession.findMany();
    console.log("SUCCESS! Sessions:", sessions);
  } catch (error) {
    console.error("PRISMA ERROR:", error);
  }
}

main();
