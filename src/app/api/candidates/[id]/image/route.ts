import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { broadcast } from "@/lib/sse-broadcaster";
import { getDashboardResultsPayload } from "@/lib/results-payload";

function inferContentType(bytes: Uint8Array) {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 6) {
    const header = String.fromCharCode(...bytes.slice(0, 6));
    if (header === "GIF87a" || header === "GIF89a") return "image/gif";
  }
  if (bytes.length >= 12) {
    const riff = String.fromCharCode(...bytes.slice(0, 4));
    const webp = String.fromCharCode(...bytes.slice(8, 12));
    if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  }
  return "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidateId = Number(id);
    if (!candidateId || Number.isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { imageBytes: true, imageUrl: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (candidate.imageBytes) {
      const imageBuffer = new Uint8Array(candidate.imageBytes);
      const contentType = inferContentType(imageBuffer);
      return new NextResponse(candidate.imageBytes, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    const fallbackUrl =
      candidate.imageUrl && candidate.imageUrl.startsWith("/api/candidates/")
        ? "/candidates/default.svg"
        : candidate.imageUrl || "/candidates/default.svg";
    return NextResponse.redirect(new URL(fallbackUrl, request.url));
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await validateSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const candidateId = Number(id);
    if (!candidateId || Number.isNaN(candidateId)) {
      return NextResponse.json({ error: "Invalid candidate id" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "file is required and must be an image" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
    }

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        imageBytes: bytes,
        imageUrl: `/api/candidates/${candidateId}/image?v=${Date.now()}`,
      },
      include: { house: true, election: true },
    });

    const payload = await getDashboardResultsPayload();
    broadcast(payload);

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("[POST /api/candidates/[id]/image]", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}