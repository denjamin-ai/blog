import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export interface SessionData {
  isAdmin: boolean;
  userId?: string;
  userRole?: "reviewer" | "reader" | "author";
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

export async function requireUser(role?: "reviewer" | "reader" | "author") {
  const session = await getSession();
  if (!session.userId) {
    redirect("/login");
  }
  if (role && session.userRole !== role) {
    // throw-compatible: return a Response that callers can return directly
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}

export async function requireAuthor() {
  const session = await getSession();
  if (!session.userId || session.userRole !== "author") {
    redirect("/login");
  }
  return session;
}
