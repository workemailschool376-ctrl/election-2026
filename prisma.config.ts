// Prisma CLI config — used by: prisma db push, prisma migrate, prisma studio
// Runtime connection is handled via the libsql adapter in src/lib/prisma.ts.
import "dotenv/config";
import path from "path";
import { pathToFileURL } from "url";
import { defineConfig } from "prisma/config";

function getDbUrl(): string {
  // Production: use Turso (libsql cloud) — embed auth token in URL for CLI
  if (process.env.TURSO_DATABASE_URL) {
    const base = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;
    return token ? `${base}?authToken=${token}` : base;
  }
  // Local: resolve dev.db relative to the project root so that
  // spaces in the path (e.g. "computer teacher") are handled correctly.
  const env = process.env.DATABASE_URL;
  if (env && env.startsWith("file:///")) return env;
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
