import { requireAuthor } from "@/lib/auth";
import { NotificationBadge } from "@/components/notification-badge";
import Link from "next/link";

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthor();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/author" className="font-bold text-lg">
              Кабинет автора
            </Link>
            <div className="flex gap-4 text-sm">
              <Link
                href="/author/articles"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Мои статьи
              </Link>
              <Link
                href="/author/profile"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Профиль
              </Link>
              <Link
                href="/author/notifications"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
              >
                Уведомления
                <NotificationBadge />
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
        redirect("/login");
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
