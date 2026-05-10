import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// PrismaLibSql is a factory — pass config object, not a pre-made libsql client
const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");
  await prisma.candidate.deleteMany();
  await prisma.house.deleteMany();
  await prisma.election.deleteMany();
  await prisma.adminSession.deleteMany();

  // ── Elections ──────────────────────────────────────────────────────────────
  const leadershipElection = await prisma.election.create({
    data: {
      id: 1,
      name: "Student Council Elections",
      type: "LEADERSHIP",
      isVisible: true,
    },
  });

  const sportsElection = await prisma.election.create({
    data: {
      id: 2,
      name: "Sports Elections",
      type: "SPORTS",
      isVisible: true,
    },
  });

  const houseElection = await prisma.election.create({
    data: {
      id: 3,
      name: "House Elections",
      type: "HOUSE",
      isVisible: true,
    },
  });

  // ── Houses ─────────────────────────────────────────────────────────────────
  const houses = await Promise.all([
    prisma.house.create({ data: { id: 1, name: "Apollo", color: "RED" } }),
    prisma.house.create({ data: { id: 2, name: "Zeus", color: "YELLOW" } }),
    prisma.house.create({ data: { id: 3, name: "Poseidon", color: "BLUE" } }),
    prisma.house.create({ data: { id: 4, name: "Mercury", color: "GREEN" } }),
  ]);

  const houseIdByName = new Map(houses.map((h) => [h.name, h.id]));

  // ── Student Council Candidates (from provided election sheets, symbols excluded) ──
  // Image 1: Head Boy: Darshit, Reuben, Sameen, Savya, Sugrim
  // Image 1: Deputy Head Boy: Aarav, Anmol, Floran
  // Image 1: Head Girl: Aananyaa, Aarya, Lavanya, Manya, Reet
  // Image 1: Deputy Head Girl: Kelsang, Neelima
  const leadershipCandidates = [
    ...["Darshit", "Reuben", "Sameen", "Savya", "Sugrim"].map((name) => ({
      name,
      role: "HEAD_BOY",
    })),
    ...["Aarav", "Anmol", "Floran"].map((name) => ({
      name,
      role: "DEPUTY_HEAD_BOY",
    })),
    ...["Aananyaa", "Aarya", "Lavanya", "Manya", "Reet"].map((name) => ({
      name,
      role: "HEAD_GIRL",
    })),
    ...["Kelsang", "Neelima"].map((name) => ({
      name,
      role: "DEPUTY_HEAD_GIRL",
    })),
  ];

  // ── Sports Candidates (Image 2) ────────────────────────────────────────────
  // Sports Captain: Aarokya, Dev, Roshan
  // Sports Vice-Captain: Daksh, Prakhayat
  const sportsCandidates = [
    ...["Aarokya", "Dev", "Roshan"].map((name) => ({
      name,
      role: "SPORTS_CAPTAIN",
    })),
    ...["Daksh", "Prakhayat"].map((name) => ({
      name,
      role: "SPORTS_VICE_CAPTAIN",
    })),
  ];

  // ── House Candidates (Images 3 & 4) ────────────────────────────────────────
  // Zeus House Captain: Anupra, Bishakha, Nawang, Nirvik, Sunab
  // Zeus House Vice Captain: Adhrit, Anaya, Pratik, Sarah, Sparsh
  // Poseidon House Captain: Aananyaa, Abhisparshika, Harshit, Ravya, Rushali, Sanvi, Tashi
  // Poseidon House Vice Captain: Aakanshya, Aaron, Aayan, Aayush, Saatvik
  // Apollo House Captain: Darshit, Sabrina, Saanvi, Samarpan, Shreyansh, Synza
  // Apollo House Vice Captain: Aarav, Divyam, Neemsang, Pranay, Saista
  // Mercury House Captain: Austin, Lavanya, Manya, Reet
  // Mercury House Vice Captain: Aarav, Ayushma, Shristi, Siraj, Tenzing
  const houseCandidates = [
    {
      house: "Apollo",
      captain: ["Darshit", "Sabrina", "Saanvi", "Samarpan", "Shreyansh", "Synza"],
      vice: ["Aarav", "Divyam", "Neemsang", "Pranay", "Saista"],
    },
    {
      house: "Zeus",
      captain: ["Anupra", "Bishakha", "Nawang", "Nirvik", "Sunab"],
      vice: ["Adhrit", "Anaya", "Pratik", "Sarah", "Sparsh"],
    },
    {
      house: "Poseidon",
      captain: [
        "Aananyaa",
        "Abhisparshika",
        "Harshit",
        "Ravya",
        "Rushali",
        "Sanvi",
        "Tashi",
      ],
      vice: ["Aakanshya", "Aaron", "Aayan", "Aayush", "Saatvik"],
    },
    {
      house: "Mercury",
      captain: ["Austin", "Lavanya", "Manya", "Reet"],
      vice: ["Aarav", "Ayushma", "Shristi", "Siraj", "Tenzing"],
    },
  ];

  const candidatesToCreate = [
    ...leadershipCandidates.map((c) => ({
      name: c.name,
      symbolName: "",
      imageUrl: "/candidates/default.svg",
      votes: 0,
      role: c.role,
      electionId: leadershipElection.id,
      houseId: null as number | null,
    })),
    ...sportsCandidates.map((c) => ({
      name: c.name,
      symbolName: "",
      imageUrl: "/candidates/default.svg",
      votes: 0,
      role: c.role,
      electionId: sportsElection.id,
      houseId: null as number | null,
    })),
    ...houseCandidates.flatMap((group) => [
      ...group.captain.map((name) => ({
        name,
        symbolName: "",
        imageUrl: "/candidates/default.svg",
        votes: 0,
        role: "HOUSE_CAPTAIN",
        electionId: houseElection.id,
        houseId: houseIdByName.get(group.house) ?? null,
      })),
      ...group.vice.map((name) => ({
        name,
        symbolName: "",
        imageUrl: "/candidates/default.svg",
        votes: 0,
        role: "HOUSE_VICE_CAPTAIN",
        electionId: houseElection.id,
        houseId: houseIdByName.get(group.house) ?? null,
      })),
    ]),
  ];

  await prisma.candidate.createMany({ data: candidatesToCreate });

  console.log("✅ Seed complete!");
  console.log("   Elections: 3");
  console.log(`   Houses: ${houses.length}`);
  console.log(`   Candidates: ${candidatesToCreate.length}`);
  console.log("");
  console.log("   Student Council:");
  console.log(`     Head Boy (${leadershipCandidates.filter(c=>c.role==="HEAD_BOY").length}): Darshit, Reuben, Sameen, Savya, Sugrim`);
  console.log(`     Deputy Head Boy (${leadershipCandidates.filter(c=>c.role==="DEPUTY_HEAD_BOY").length}): Aarav, Anmol, Floran`);
  console.log(`     Head Girl (${leadershipCandidates.filter(c=>c.role==="HEAD_GIRL").length}): Aananyaa, Aarya, Lavanya, Manya, Reet`);
  console.log(`     Deputy Head Girl (${leadershipCandidates.filter(c=>c.role==="DEPUTY_HEAD_GIRL").length}): Kelsang, Neelima`);
  console.log("   Sports:");
  console.log(`     Sports Captain (${sportsCandidates.filter(c=>c.role==="SPORTS_CAPTAIN").length}): Aarokya, Dev, Roshan`);
  console.log(`     Sports Vice-Captain (${sportsCandidates.filter(c=>c.role==="SPORTS_VICE_CAPTAIN").length}): Daksh, Prakhayat`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
