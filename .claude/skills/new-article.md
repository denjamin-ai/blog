---
name: new-article
description: "Create a new blog article draft in the database. Use this skill when the user wants to write a new post, create an article, start a draft, or says 'new post', 'write about...', 'create article about...'. Handles slug generation from Russian or English titles, inserts into the database, and provides the admin edit URL."
---

# New Article

Create a new draft article in the database with a generated slug and edit URL.

## Steps

1. **Get the title** — Extract from user input. If no title provided, ask for one. Titles are typically in Russian.

2. **Generate slug** — Convert title to a URL-safe slug:
   - Transliterate Cyrillic → Latin (е→e, ш→sh, etc.)
   - Lowercase everything
   - Replace spaces and special chars with hyphens
   - Remove consecutive hyphens
   - Trim to 60 chars max

3. **Insert into database** — Create a small inline script that imports from project modules and inserts:

   ```bash
   npx tsx -e "
   import { db } from './src/lib/db/index';
   import { articles } from './src/lib/db/schema';
   import { ulid } from 'ulid';
   const id = ulid();
   const now = Math.floor(Date.now() / 1000);
   await db.insert(articles).values({
     id,
     slug: 'GENERATED_SLUG',
     title: 'USER_TITLE',
     content: '# USER_TITLE\n\nНапишите содержимое статьи здесь...',
     excerpt: '',
     tags: '[]',
     status: 'draft',
     publishedAt: null,
     createdAt: now,
     updatedAt: now,
   });
   console.log('Created article:', id);
   process.exit(0);
   "
   ```

4. **Report** — Show the article ID, slug, and admin edit link: `/admin/articles/[id]`
