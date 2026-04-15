import { db } from "@/lib/db";
import { profile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseLinks } from "@/lib/utils";

export async function Footer() {
  const [profileRow] = await db
    .select({ name: profile.name, links: profile.links })
    .from(profile)
    .where(eq(profile.id, "main"))
    .limit(1);

  const links = parseLinks(profileRow?.links ?? "{}");

  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} {profileRow?.name || "devblog"}
        </p>
        <div className="flex items-center gap-5">
          {links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          )}
          {links.telegram && (
            <a
              href={links.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Telegram
            </a>
          )}
          {links.website && (
            <a
              href={links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Сайт
            </a>
          )}
          <a
            href="/feed.xml"
            className="hover:text-foreground transition-colors"
            aria-label="RSS-фид"
            title="Подписаться на RSS"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="6.18" cy="17.82" r="2.18" />
              <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
