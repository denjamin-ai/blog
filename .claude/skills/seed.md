---
name: seed
description: "Run the database seed script to populate or refresh dev data. Use this skill when the user mentions seeding, resetting data, populating the database, refreshing test articles, or after schema changes that require new seed data. Also use when the user says 'reset db', 'add test data', or 'run seed'."
---

# Seed Database

Run the seed script to populate the local database with profile and test articles.

## Why a dedicated skill

The seed script uses `onConflictDoUpdate` so it's safe to run repeatedly — it updates existing records rather than duplicating them. The script also requires `process.exit(0)` at the end because `@libsql/client` keeps the connection alive indefinitely.

## Steps

1. Run the seed:

   ```bash
   npx tsx src/lib/db/seed.ts
   ```

2. Verify output contains both success messages:
   - "Profile seeded"
   - "Articles seeded (3 articles)"

3. If the script fails, read `src/lib/db/seed.ts` and diagnose. Common issues:
   - **Schema mismatch**: Run `npx drizzle-kit migrate` first
   - **File lock**: Another process has `blog.db` open — stop `npm run dev` and retry
   - **Hanging**: Missing `process.exit(0)` at end of script

4. Report the result — success or failure with diagnosis.
