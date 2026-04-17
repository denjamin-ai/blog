"use client";

import { useEffect, useRef, useState } from "react";

export type GuideRole = "guest" | "reader" | "author" | "reviewer" | "admin";

interface GuideSection {
  heading: string;
  items: string[];
}

interface GuideContent {
  title: string;
  sections: GuideSection[];
}

const GUIDE_CONTENT: Record<GuideRole, GuideContent> = {
  guest: {
    title: "Возможности для гостей",
    sections: [
      {
        heading: "Чтение контента",
        items: [
          "Читайте статьи с удобным оглавлением (TOC)",
          "Индикатор сложности статьи: простая, средняя, сложная",
          "RSS-лента для подписки на обновления блога",
          "Публичные профили авторов с их статьями",
        ],
      },
      {
        heading: "Хотите больше?",
        items: [
          "Зарегистрируйтесь, чтобы оставлять комментарии и голосовать",
          "После входа доступны закладки и подписки на авторов",
          "Подпишитесь на автора и получайте уведомления о новых статьях",
        ],
      },
    ],
  },
  reader: {
    title: "Возможности читателя",
    sections: [
      {
        heading: "Комментарии и голоса",
        items: [
          "Оставляйте комментарии к статьям (до 2 уровней вложенности)",
          "Редактируйте свои комментарии в течение 15 минут после публикации",
          "Голосуйте за статьи и комментарии (+1 / −1)",
        ],
      },
      {
        heading: "Персонализация",
        items: [
          "Сохраняйте статьи в закладки — страница /bookmarks",
          "Подписывайтесь на авторов и читайте их ленту на /reader",
          "Получайте уведомления о новых статьях от подписок",
        ],
      },
    ],
  },
  author: {
    title: "Руководство автора",
    sections: [
      {
        heading: "Синтаксис MDX",
        items: [
          "Заголовки: # H1, ## H2, ### H3 — структурируют статью и формируют оглавление",
          "Форматирование: **жирный**, *курсив*, ~~зачёркнутый~~, `код`",
          "Списки: нумерованные (1. пункт) и маркированные (- пункт), вложенные через 2 пробела",
          "Блоки кода: тройные обратные кавычки с указанием языка (```js, ```python, ```sql)",
          "Таблицы: | Заголовок | Заголовок | с разделителем |---|---|",
          "Ссылки: [текст](url), изображения Markdown: ![alt](url)",
          "Горизонтальная линия: --- (три дефиса на отдельной строке)",
        ],
      },
            {
        heading: "MDX-компоненты",
        items: [
          '<Expandable title="Заголовок">Содержимое</Expandable> — раскрывающийся блок',
          "<Mermaid chart={`graph TD; A-->B`} /> — диаграммы: flowchart, sequence, class, ER, Gantt, pie",
          '<Diagram type="plantuml" chart={`@startuml...@enduml`} /> — Kroki: PlantUML, BPMN, D2, Graphviz',
          '<ArticleImage src="/uploads/file.jpg" alt="описание" caption="подпись" /> — изображение',
          "<ArticleImage src=\"...\" alt=\"...\" width={600} height={400} /> — изображение с размерами",
          '<ArticleVideo src="/uploads/file.mp4" poster="/uploads/poster.jpg" /> — видео с постером',
          "<ArticleVideo src=\"...\" width={800} /> — видео с ограничением ширины",
          "Используйте кнопку «Диаграмма» для выбора типа и вставки шаблона",
        ],
      },
      {
        heading: "LaTeX-формулы",
        items: [
          "Строчные: $E = mc^2$ — формула внутри текста",
          "Блочные: $$\\int_0^\\infty e^{-x} dx = 1$$ — отдельный блок по центру",
          "Дроби: $\\frac{a}{b}$, корни: $\\sqrt{x}$, степени: $x^{n}$, индексы: $x_{i}$",
          "Греческие буквы: $\\alpha, \\beta, \\gamma, \\pi, \\Omega$",
          "Матрицы: $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$",
          "Используйте кнопку «Формула» в панели инструментов для быстрой вставки",
        ],
      },
      {
        heading: "Медиафайлы",
        items: [
          "Загрузка: кнопка «Загрузить медиа» в панели инструментов или перетаскивание файла",
          "Изображения: JPG, PNG, WebP — до 2 МБ",
          "Видео: MP4, WebM — до 10 МБ, максимум 45 секунд",
          "После загрузки задайте ширину и высоту в пикселях (поля предзаполняются размером файла)",
          "Пустые поля размеров — медиа растянется на всю ширину контента",
          "Нажмите «Вставить» — MDX-тег появится в позиции курсора",
        ],
      },
            {
        heading: "Написание статей",
        items: [
          "Создавайте статьи в разделе «Мои статьи» → «Новая статья»",
          "Редактор поддерживает формат MDX — расширенный Markdown с компонентами",
          "Live-preview: переключайте расположение превью (справа, слева, снизу, скрыть)",
          "Drag-and-drop: перетащите файл прямо в область редактора для загрузки",
        ],
      },
      {
        heading: "Процесс ревью",
        items: [
          "Отправьте статью на ревью: кнопка «На ревью» → выберите одного или нескольких ревьюеров",
          "Для средней сложности нужен минимум 1 ревьюер, для сложной — минимум 2, максимум 3",
          "Статус назначения: ожидание → принято → завершено (или отклонено)",
          "Общий чат сессии: все ревьюеры и вы видите одни и те же сообщения",
          "Отвечайте на замечания ревьюеров — они могут отметить свои замечания как решённые",
          "Обновите статью и нажмите «Уведомить ревьюеров» — они получат уведомление и увидят diff",
        ],
      },
      {
        heading: "Планирование и публикация",
        items: [
          "Жизненный цикл: Черновик → Ревью → Публикация",
          "Запланируйте публикацию: укажите дату и время в будущем (публикация произойдёт автоматически)",
          "Публичный changelog: добавьте запись об изменениях, видимую читателям",
          "Профиль автора: заполните отображаемое имя, био и ссылки — они видны на вашей публичной странице",
          "Slug профиля: уникальный URL вашей страницы (/authors/ваш-slug)",
        ],
      }
    ],
  },
  reviewer: {
    title: "Руководство ревьюера",
    sections: [
      {
        heading: "Назначения",
        items: [
          "Вы получаете уведомление, когда автор или админ назначает вас ревьюером статьи",
          "Примите назначение (accepted) или отклоните (declined) — кнопки на странице назначения",
          "Статус назначения: ожидание → принято → завершено",
          "Вы можете быть одним из нескольких ревьюеров в сессии (до 3 человек)",
          "На странице назначения видны имена и статусы других ревьюеров сессии",
        ],
      },
      {
        heading: "Чеклист проверки",
        items: [
          "Каждое назначение содержит чеклист — список пунктов для проверки",
          "Отмечайте пункты по мере проверки (чекбоксы сохраняются автоматически)",
          "Прогресс показывается как «Проверено N из M»",
          "Шаблон чеклиста настраивается администратором и копируется при назначении",
        ],
      },
      {
        heading: "Замечания и чат",
        items: [
          "Общий чат сессии: все ревьюеры, автор и админ видят одни и те же сообщения",
          "Оставляйте замечания — автор видит их и может ответить",
          "Автор или админ могут отметить замечание как решённое",
          "Вы можете переоткрыть решённое замечание, если проблема не устранена",
          "Фильтры: все, открытые, решённые, без ответа — для удобной навигации",
        ],
      },
      {
        heading: "Diff и обновления",
        items: [
          "Просматривайте diff: сравнение статьи с момента вашего назначения и текущей версии",
          "Вкладки «Статья» и «Изменения» — переключайтесь для удобного обзора",
          "При обновлении статьи автором вы получаете уведомление",
          "Diff помогает увидеть, что именно изменилось после ваших замечаний",
        ],
      },
      {
        heading: "Вердикт",
        items: [
          "Approved — статья готова к публикации, замечаний нет или все исправлены",
          "Needs work — требуются доработки, автор должен внести изменения и повторить ревью",
          "Rejected — статья не подходит для публикации в текущем виде",
          "Вердикт обязателен при завершении — без него завершить назначение нельзя",
          "Если есть незакрытые замечания, вы увидите предупреждение перед вынесением вердикта",
          "После вердикта назначение переходит в статус «завершено» (комментарии замораживаются)",
        ],
      },
    ],
  },
  admin: {
    title: "Возможности администратора",
    sections: [
      {
        heading: "Управление контентом",
        items: [
          "Создавайте и редактируйте статьи всех авторов",
          "Отправляйте статьи на ревью — выберите до 3 ревьюеров",
          "Управляйте сессиями ревью: открытые, завершённые",
          "Настраивайте шаблон чеклиста — он копируется при каждом новом назначении",
        ],
      },
      {
        heading: "Администрирование",
        items: [
          "CRUD пользователей: создание, редактирование, удаление",
          "Блокировка авторов (скрывает все их статьи) и блокировка комментирования",
          "Настройки блога: имя, описание, ссылки, дефолтное OG-изображение",
        ],
      },
    ],
  },
};

export function GuideButton({ role }: { role: GuideRole }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => setOpen(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setOpen(false);
    }
  }

  const content = GUIDE_CONTENT[role];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        aria-label="Открыть руководство"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        aria-label={content.title}
        className="m-auto max-w-lg w-full rounded-xl bg-background border border-border p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-dialog-in"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-6 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold">{content.title}</h2>
            <button
              onClick={() => setOpen(false)}
              className="p-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors text-xl leading-none rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="space-y-5">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {section.heading}
                </h3>
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
