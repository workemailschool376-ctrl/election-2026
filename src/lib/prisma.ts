import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  // Production: use Turso (LibSQL cloud) via adapter
  if (process.env.TURSO_DATABASE_URL) {
    console.log("🔗 Connecting to Turso cloud database...");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");

    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  // Local development: use native SQLite (no adapter needed)
  if (process.env.DATABASE_URL) {
    console.log("🗄️  Using local SQLite database...");
    return new PrismaClient();
  }

  // Neither set — will crash with a clear error in logs
  console.error("❌ No database configured! Set TURSO_DATABASE_URL on Render (or DATABASE_URL for local dev).");
  return new PrismaClient(); // will fail on first query with a clear message
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

