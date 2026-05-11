import { cookies } from "next/headers";
import { createSession, COOKIE_NAME } from "@/lib/auth";

const ADMIN_USERNAME = "admin";
// Read from env var — set ADMIN_PASSWORD in Render dashboard
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
if (!process.env.ADMIN_PASSWORD) {
  console.warn("⚠️  ADMIN_PASSWORD env var not set — using default 'admin123'");
}
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const sessionId = await createSession();
    const expires = new Date(Date.now() + SESSION_DURATION_MS);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      expires,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
