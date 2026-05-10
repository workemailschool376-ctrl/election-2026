import { cookies } from "next/headers";
import { deleteSession, COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    await deleteSession();
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return Response.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return Response.json({ error: "Logout failed" }, { status: 500 });
  }
}
