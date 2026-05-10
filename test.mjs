import { PrismaClient } from "./src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "path";
import { pathToFileURL } from "url";

async function main() {
  try {
    const dbPath = path.resolve(process.cwd(), "dev.db");
    const dbUrl = pathToFileURL(dbPath).toString();
    console.log("Using URL:", dbUrl);

    const libsql = createClient({ url: dbUrl });
    const adapter = new PrismaLibSql(libsql);
    const prisma = new PrismaClient({ adapter });

    const sessions = await prisma.adminSession.findMany();
    console.log("Success! Sessions:", sessions.length);
  } catch (e) {
    console.error("ERROR:", e);
  }
}

main();
