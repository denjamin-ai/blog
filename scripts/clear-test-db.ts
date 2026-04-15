/**
 * clear-test-db.ts
 *
 * Clears all data from blog.test.db without deleting the file.
 * This keeps the libsql connection in the running dev server valid
 * (avoids SQLITE_READONLY_DBMOVED that occurs when the file is deleted).
 */
import { createClient } from "@libsql/client";

const db = createClient({ url: "file:blog.test.db" });

// Delete order respects FK constraints (children before parents)
// Names must match actual SQLite table names (snake_case, as Drizzle generates)
const tables = [
  "notifications",
  "article_changelog",
  "comment_votes",
  "article_votes",
  "bookmarks",
  "subscriptions",
  "public_comments",
  "review_comments",
  "review_checklists",
  "review_assignments",
  "article_versions",
  "profile_versions",
  "articles",
  "users",
  "profile",
];

async function clearDB() {
  await db.execute("PRAGMA foreign_keys = OFF");
  for (const table of tables) {
    await db.execute(`DELETE FROM "${table}"`);
  }
  await db.execute("PRAGMA foreign_keys = ON");
  console.log("✅ Все таблицы очищены");
}

clearDB()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Ошибка очистки БД:", e);
    process.exit(1);
  });
