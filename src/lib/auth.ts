import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "election_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function createSession(): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await prisma.adminSession.create({
    data: { expiresAt },
  });
  return session.id;
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionId) return false;

  const session = await prisma.adminSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { id: sessionId } });
    return false;
  }
  return true;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.adminSession
      .delete({ where: { id: sessionId } })
      .catch(() => {});
  }
}

export function getSessionCookieOptions(sessionId: string, expires: Date) {
  return {
    name: COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    expires,
  };
}

export { COOKIE_NAME };
