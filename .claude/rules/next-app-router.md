---
description: Конвенции Next.js App Router
paths: ["src/app/**"]
---
- params — Promise в Next.js 16: `const { slug } = await params`
- dynamic = "force-dynamic" на страницах с БД-запросами
- route groups: `(protected)` для admin
- Metadata через `generateMetadata()` или статический `metadata`
- error.tsx и loading.tsx на каждом уровне