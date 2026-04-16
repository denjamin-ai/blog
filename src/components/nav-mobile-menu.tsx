"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

interface NavLink {
  href: string;
  label: string;
}

interface NavMobileMenuProps {
  links: NavLink[];
  userPortalHref?: string;
  userPortalLabel?: string;
  isLoggedIn: boolean;
  logoutAction?: () => Promise<void>;
}

export function NavMobileMenu({
  links,
  userPortalHref,
  userPortalLabel,
  isLoggedIn,
  logoutAction,
}: NavMobileMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex sm:hidden items-center gap-2">
      <ThemeToggle />
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3 space-y-1 z-50">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn && userPortalHref && (
            <Link
              href={userPortalHref}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
              onClick={() => setOpen(false)}
            >
              {userPortalLabel ?? "Личный кабинет"}
            </Link>
          )}
          {!isLoggedIn && (
            <Link
              href="/login"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
              onClick={() => setOpen(false)}
            >
              Войти
            </Link>
          )}
          {isLoggedIn && logoutAction && (
            <form action={logoutAction}>
              <button
                type="submit"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 w-full text-left"
              >
                Выйти
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
