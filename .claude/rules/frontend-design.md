---
description: Дизайн-конвенции для UI
paths: ["src/components/**", "src/app/**/page.tsx", "src/app/**/layout.tsx"]
---
## Типографика
- НЕ: Inter, Roboto, Arial, Open Sans, Space Grotesk
- Шрифты проекта из next/font, weight contrast (200 vs 800)
- Заголовки минимум 3× крупнее body
- Строка чтения: max-w-prose (50–75 символов)

## Цвет
- CSS-переменные из @theme
- Контраст: минимум 4.5:1 (WCAG AA)
- Dark mode через light-dark() или dark: variant

## Анимации
- CSS-only, motion-safe:/motion-reduce:
- Только transform и opacity — никогда width/height/margin

## Банлист
- ❌ Cards в cards, template 3-column, flat backgrounds
- ❌ Font weights только 400–600
- ❌ Отсутствие hover/focus/disabled/loading states