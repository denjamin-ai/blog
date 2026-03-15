import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface SessionData {
  isAdmin: boolean;
}

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET env variable is required");
}

const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "blog_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
  ttl: 60 * 60 * 24 * 7, // 7 days
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect("/admin/login");
  }
  return session;
}
