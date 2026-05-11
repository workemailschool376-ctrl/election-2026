/**
 * setup-turso.ts
 * Run ONCE before first deployment to create tables and seed Turso.
 * Usage:
 *   $env:TURSO_DATABASE_URL="libsql://..."
 *   $env:TURSO_AUTH_TOKEN="ey..."
 *   npx tsx scripts/setup-turso.ts
 */
import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("❌ TURSO_DATABASE_URL is not set");
  process.exit(1);
}

const libsql = createClient({ url, authToken });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

// ── Step 1: Create tables ────────────────────────────────────────────────────
async function createTables() {
  console.log("📦 Creating tables in Turso...");

  await libsql.executeMultiple(`
    CREATE TABLE IF NOT EXISTS "Election" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "isVisible" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "House" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "color" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Candidate" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "symbolName" TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL DEFAULT '/candidates/default.png',
      "imageBytes" BLOB,
      "votes" INTEGER NOT NULL DEFAULT 0,
      "role" TEXT NOT NULL,
      "electionId" INTEGER NOT NULL,
      "houseId" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Candidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Candidate_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "AdminSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "expiresAt" DATETIME NOT NULL
    );
  `);

  console.log("✅ Tables created!");
}

// ── Step 2: Seed data ────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Seeding Turso database...");

  // Clear existing data
  await prisma.candidate.deleteMany();
  await prisma.house.deleteMany();
  await prisma.election.deleteMany();
  await prisma.adminSession.deleteMany();

  // Elections
  const leadershipElection = await prisma.election.create({
    data: { id: 1, name: "Student Council Elections", type: "LEADERSHIP", isVisible: true },
  });
  const sportsElection = await prisma.election.create({
    data: { id: 2, name: "Sports Elections", type: "SPORTS", isVisible: true },
  });
  const houseElection = await prisma.election.create({
    data: { id: 3, name: "House Elections", type: "HOUSE", isVisible: true },
  });

  // Houses
  const houses = await Promise.all([
    prisma.house.create({ data: { id: 1, name: "Apollo", color: "RED" } }),
    prisma.house.create({ data: { id: 2, name: "Zeus", color: "YELLOW" } }),
    prisma.house.create({ data: { id: 3, name: "Poseidon", color: "BLUE" } }),
    prisma.house.create({ data: { id: 4, name: "Mercury", color: "GREEN" } }),
  ]);
  const houseIdByName = new Map(houses.map((h) => [h.name, h.id]));

  // Leadership candidates
  const leadershipCandidates = [
    ...["Darshit", "Reuben", "Sameen", "Savya", "Sugrim"].map((name) => ({ name, role: "HEAD_BOY" })),
    ...["Aarav", "Anmol", "Floran"].map((name) => ({ name, role: "DEPUTY_HEAD_BOY" })),
    ...["Aananyaa", "Aarya", "Lavanya", "Manya", "Reet"].map((name) => ({ name, role: "HEAD_GIRL" })),
    ...["Kelsang", "Neelima"].map((name) => ({ name, role: "DEPUTY_HEAD_GIRL" })),
  ];

  // Sports candidates
  const sportsCandidates = [
    ...["Aarokya", "Dev", "Roshan"].map((name) => ({ name, role: "SPORTS_CAPTAIN" })),
    ...["Daksh", "Prakhayat"].map((name) => ({ name, role: "SPORTS_VICE_CAPTAIN" })),
  ];

  // House candidates
  const houseCandidates = [
    { house: "Apollo",   captain: ["Darshit","Sabrina","Saanvi","Samarpan","Shreyansh","Synza"], vice: ["Aarav","Divyam","Neemsang","Pranay","Saista"] },
    { house: "Zeus",     captain: ["Anupra","Bishakha","Nawang","Nirvik","Sunab"],                vice: ["Adhrit","Anaya","Pratik","Sarah","Sparsh"] },
    { house: "Poseidon", captain: ["Aananyaa","Abhisparshika","Harshit","Ravya","Rushali","Sanvi","Tashi"], vice: ["Aakanshya","Aaron","Aayan","Aayush","Saatvik"] },
    { house: "Mercury",  captain: ["Austin","Lavanya","Manya","Reet"],                           vice: ["Aarav","Ayushma","Shristi","Siraj","Tenzing"] },
  ];

  const candidatesToCreate = [
    ...leadershipCandidates.map((c) => ({ name: c.name, symbolName: "", imageUrl: "/candidates/default.svg", votes: 0, role: c.role, electionId: leadershipElection.id, houseId: null as number | null })),
    ...sportsCandidates.map((c) => ({ name: c.name, symbolName: "", imageUrl: "/candidates/default.svg", votes: 0, role: c.role, electionId: sportsElection.id, houseId: null as number | null })),
    ...houseCandidates.flatMap((g) => [
      ...g.captain.map((name) => ({ name, symbolName: "", imageUrl: "/candidates/default.svg", votes: 0, role: "HOUSE_CAPTAIN", electionId: houseElection.id, houseId: houseIdByName.get(g.house) ?? null })),
      ...g.vice.map((name) => ({ name, symbolName: "", imageUrl: "/candidates/default.svg", votes: 0, role: "HOUSE_VICE_CAPTAIN", electionId: houseElection.id, houseId: houseIdByName.get(g.house) ?? null })),
    ]),
  ];

  await prisma.candidate.createMany({ data: candidatesToCreate });

  console.log("✅ Seed complete!");
  console.log(`   Elections: 3 | Houses: 4 | Candidates: ${candidatesToCreate.length}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await createTables();
  await seed();
}

main()
  .catch((e) => { console.error("❌ Setup failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
