import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session.isAdmin) {
    redirect("/admin");
  }
  return <LoginForm />;
}
