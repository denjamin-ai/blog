---
description: Конвенции MDX-компонентов
paths: ["src/components/mdx/**", "src/lib/mdx.ts"]
---
- Компоненты регистрируются в components map в src/lib/mdx.ts
- RunCode: iframe sandbox обязателен, экранируй `</` через JSON.stringify
- Код через rehype-pretty-code — не используй Shiki напрямую
- CodeCopyButtons: DOM manipulation на `[data-rehype-pretty-code-figure]`
- Все компоненты работают в dark/light теме
- cleanup в useEffect (listeners, timers, blob URLs)