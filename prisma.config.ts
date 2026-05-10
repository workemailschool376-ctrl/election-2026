// Prisma 7.x config — connection URL for Migrate / Studio.
// Runtime connection is handled via the libsql adapter in src/lib/prisma.ts.
import "dotenv/config";
import path from "path";
import { pathToFileURL } from "url";
import { defineConfig } from "prisma/config";

function getDbUrl(): string {
  const env = process.env.DATABASE_URL;
  // If already an absolute file URL, use it directly
  if (env && env.startsWith("file:///")) return env;
  // Otherwise resolve dev.db relative to the project root so that
  // spaces in the path (e.g. "computer teacher") are handled correctly.
  const dbPath = path.resolve(process.cwd(), "dev.db");
  return pathToFileURL(dbPath).toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDbUrl(),
  },
});
