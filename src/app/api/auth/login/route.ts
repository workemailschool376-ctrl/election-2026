import { cookies } from "next/headers";
import { createSession, COOKIE_NAME } from "@/lib/auth";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
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
