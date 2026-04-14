import { requireUser } from "@/lib/auth";
import { NotificationBadge } from "@/components/notification-badge";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireUser("reviewer");
  } catch (err) {
    if (err instanceof Response) {
      // Wrong role (403) — send to login
      redirect("/login");
    }
    // Re-throw NEXT_REDIRECT (not logged in → requireUser already redirected)
    throw err;
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/reviewer" className="font-bold text-lg">
              Ревью
            </Link>
            <div className="flex gap-4 text-sm">
              <Link
                href="/reviewer/assignments"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Назначения
              </Link>
              <Link
                href="/reviewer/notifications"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
              >
                Уведомления
                <NotificationBadge />
              </Link>
            </div>
          </div>
          <LogoutButton />
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        session.destroy();
        const { redirect: nav } = await import("next/navigation");
        nav("/login");
      }}
    >
      <button
        type="submit"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Выйти
      </button>
    </form>
  );
}
