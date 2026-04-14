import { requireAdmin } from "@/lib/auth";
import { NotificationBadge } from "@/components/notification-badge";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-lg">
              Админка
            </Link>
            <div className="flex gap-4 text-sm">
              <Link
                href="/admin/articles"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Статьи
              </Link>
              <Link
                href="/admin/users"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Пользователи
              </Link>
              <Link
                href="/admin/notifications"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
              >
                Уведомления
                <NotificationBadge />
              </Link>
              <Link
                href="/admin/settings"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Настройки
              </Link>
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Сайт &rarr;
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
        const { redirect } = await import("next/navigation");
        redirect("/admin/login");
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
