import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBadge } from "./notification-badge";
import { NavMobileMenu } from "./nav-mobile-menu";
import { GuideButton, type GuideRole } from "./guide-modal";

const navLinks = [{ href: "/blog", label: "Блог" }];

export async function Nav() {
  const session = await getSession();

  const isAdmin = session.isAdmin;
  const userRole = session.userRole;
  const isLoggedIn = !!(session.userId || session.isAdmin);

  let portalHref: string | undefined;
  let portalLabel: string | undefined;

  if (isAdmin) {
    portalHref = "/admin";
    portalLabel = "Админка";
  } else if (userRole === "author") {
    portalHref = "/author";
    portalLabel = "Кабинет автора";
  } else if (userRole === "reviewer") {
    portalHref = "/reviewer";
    portalLabel = "Кабинет ревьюера";
  } else if (userRole === "reader") {
    portalHref = "/reader";
    portalLabel = "Лента";
  }

  const guideRole: GuideRole =
    isAdmin ? "admin"
    : userRole === "reader" || userRole === "author" || userRole === "reviewer"
    ? userRole
    : "guest";

  async function logoutAction() {
    "use server";
    const { getSession } = await import("@/lib/auth");
    const sess = await getSession();
    const isAdminSession = sess.isAdmin;
    sess.destroy();
    const { redirect } = await import("next/navigation");
    redirect(isAdminSession ? "/admin/login" : "/login");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md relative">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-display font-bold text-xl hover:text-accent transition-colors"
        >
          devblog
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}

          <GuideButton role={guideRole} />
          <ThemeToggle />

          {isLoggedIn && portalHref && (
            <Link
              href={portalHref}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {portalLabel}
            </Link>
          )}

          {isLoggedIn && <NotificationBadge />}

          {isLoggedIn ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Выйти
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Войти
            </Link>
          )}
        </div>

        {/* Mobile */}
        <NavMobileMenu
          links={navLinks}
          userPortalHref={portalHref}
          userPortalLabel={portalLabel}
          isLoggedIn={isLoggedIn}
          logoutAction={isLoggedIn ? logoutAction : undefined}
          guideRole={guideRole}
        />
      </div>
    </nav>
  );
}
