import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (session.isAdmin) redirect("/admin");
  if (session.userRole === "author") redirect("/author");
  if (session.userRole === "reviewer") redirect("/reviewer");
  if (session.userRole === "reader") redirect("/reader");

  // Гость
  redirect("/blog");
}
