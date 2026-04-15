"use client";

import { useState } from "react";

interface DiagramInserterProps {
  onInsert: (text: string) => void;
}

type DiagramGroup = "mermaid" | "kroki";

interface DiagramType {
  id: string;
  label: string;
  group: DiagramGroup;
  template: string;
}

const DIAGRAM_TYPES: DiagramType[] = [
  {
    id: "mermaid-flowchart",
    label: "Флоучарт",
    group: "mermaid",
    template: `<Mermaid chart={\`flowchart LR
    A[Начало] --> B{Условие}
    B -->|Да| C[Действие]
    B -->|Нет| D[Конец]
\`} />`,
  },
  {
    id: "mermaid-sequence",
    label: "Последовательность",
    group: "mermaid",
    template: `<Mermaid chart={\`sequenceDiagram
    Alice->>Bob: Привет
    Bob-->>Alice: Привет!
\`} />`,
  },
  {
    id: "mermaid-class",
    label: "Классы",
    group: "mermaid",
    template: `<Mermaid chart={\`classDiagram
    class Animal {
        +String name
        +makeSound()
    }
    class Dog {
        +fetch()
    }
    Animal <|-- Dog
\`} />`,
  },
  {
    id: "mermaid-state",
    label: "Состояния",
    group: "mermaid",
    template: `<Mermaid chart={\`stateDiagram-v2
    [*] --> Idle
    Idle --> Running : start
    Running --> Idle : stop
    Running --> [*] : finish
\`} />`,
  },
  {
    id: "mermaid-er",
    label: "ER-диаграмма",
    group: "mermaid",
    template: `<Mermaid chart={\`erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "referenced by"
\`} />`,
  },
  {
    id: "mermaid-gantt",
    label: "Диаграмма Ганта",
    group: "mermaid",
    template: `<Mermaid chart={\`gantt
    title Проект
    dateFormat YYYY-MM-DD
    section Фаза 1
    Задача 1 :a1, 2024-01-01, 30d
    Задача 2 :after a1, 20d
\`} />`,
  },
  {
    id: "mermaid-pie",
    label: "Круговая",
    group: "mermaid",
    template: `<Mermaid chart={\`pie title Распределение
    "Компонент A" : 40
    "Компонент B" : 35
    "Компонент C" : 25
\`} />`,
  },
  {
    id: "mermaid-mindmap",
    label: "Майндмап",
    group: "mermaid",
    template: `<Mermaid chart={\`mindmap
  root((Тема))
    Ветка 1
      Пункт 1.1
      Пункт 1.2
    Ветка 2
      Пункт 2.1
\`} />`,
  },
  {
    id: "mermaid-timeline",
    label: "Таймлайн",
    group: "mermaid",
    template: `<Mermaid chart={\`timeline
    title История проекта
    2022 : Идея
    2023 : Разработка
         : Первый релиз
    2024 : Масштабирование
\`} />`,
  },
  {
    id: "mermaid-gitgraph",
    label: "Git граф",
    group: "mermaid",
    template: `<Mermaid chart={\`gitGraph
   commit id: "init"
   branch feature
   checkout feature
   commit id: "feature work"
   checkout main
   merge feature
   commit id: "release"
\`} />`,
  },
  {
    id: "plantuml",
    label: "PlantUML",
    group: "kroki",
    template: `<Diagram type="plantuml" chart={\`@startuml
Alice -> Bob: Запрос
Bob --> Alice: Ответ
@enduml\`} />`,
  },
  {
    id: "bpmn",
    label: "BPMN",
    group: "kroki",
    template: `<Diagram type="bpmn" chart={\`<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             targetNamespace="http://www.example.org/definitions">
  <process id="process1" isExecutable="true">
    <startEvent id="start" />
    <endEvent id="end" />
    <sequenceFlow id="flow1" sourceRef="start" targetRef="end" />
  </process>
</definitions>\`} />`,
  },
  {
    id: "wavedrom",
    label: "WaveDrom",
    group: "kroki",
    template: `<Diagram type="wavedrom" chart={\`{ signal: [
  { name: "clk",  wave: "p.....|..." },
  { name: "data", wave: "x.345x|=.x", data: ["a","b","c","d"] },
  { name: "req",  wave: "0.1...01..." }
]}\`} />`,
  },
  {
    id: "graphviz",
    label: "Graphviz",
    group: "kroki",
    template: `<Diagram type="graphviz" chart={\`digraph G {
  rankdir=LR;
  A -> B;
  B -> C;
  A -> C [style=dashed];
}\`} />`,
  },
  {
    id: "d2",
    label: "D2",
    group: "kroki",
    template: `<Diagram type="d2" chart={\`direction: right
Сервер -> БД: запрос
БД -> Сервер: ответ
Клиент -> Сервер: HTTP
\`} />`,
  },
  {
    id: "circuit",
    label: "Схема (TikZ)",
    group: "kroki",
    template: `<Circuit code={\`\\\\begin{tikzpicture}
  \\\\draw (0,0) to[R, l=\\$R_1\\$] (2,0) to[C, l=\\$C_1\\$] (4,0);
  \\\\draw (0,0) -- (0,-1.5) -- (4,-1.5) -- (4,0);
\\\\end{tikzpicture}\`} />`,
  },
];

const MERMAID_TYPES = DIAGRAM_TYPES.filter((d) => d.group === "mermaid");
const KROKI_TYPES = DIAGRAM_TYPES.filter((d) => d.group === "kroki");

export function DiagramInserter({ onInsert }: DiagramInserterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<DiagramType>(DIAGRAM_TYPES[0]);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  async function handleSelect(dt: DiagramType) {
    setSelected(dt);
    setPreviewSvg(null);
    setPreviewError(null);

    if (dt.group === "mermaid") {
      try {
        // Extract chart content from template for inline preview
        const match = dt.template.match(/chart=\{`([\s\S]*?)`\s*\}/);
        const chart = match?.[1];
        if (chart) {
          const m = (await import("mermaid")).default;
          m.initialize({ startOnLoad: false, theme: "default" });
          const { svg } = await m.render(`preview-${dt.id}`, chart);
          setPreviewSvg(svg);
        }
      } catch (e) {
        setPreviewError(
          e instanceof Error ? e.message : "Ошибка предпросмотра",
        );
      }
    }
  }

  function handleInsert() {
    onInsert(selected.template);
    setIsOpen(false);
    setPreviewSvg(null);
    setPreviewError(null);
  }

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors font-medium"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M17.5 14v7M14 17.5h7" />
        </svg>
        Диаграмма
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 p-3 border border-border rounded-lg bg-muted/30 space-y-3">
          {/* Mermaid types */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">
              Mermaid (клиентский рендер)
            </p>
            <div className="flex flex-wrap gap-1">
              {MERMAID_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => handleSelect(dt)}
                  aria-pressed={selected.id === dt.id}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    selected.id === dt.id
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kroki types */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">
              Kroki (серверный рендер)
            </p>
            <div className="flex flex-wrap gap-1">
              {KROKI_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => handleSelect(dt)}
                  aria-pressed={selected.id === dt.id}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    selected.id === dt.id
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview area */}
          <div className="min-h-[4rem] px-3 py-2 border border-border rounded-lg bg-background overflow-auto">
            {selected.group === "mermaid" ? (
              previewError ? (
                <p className="text-xs text-danger">{previewError}</p>
              ) : previewSvg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                  className="[&_svg]:max-w-full [&_svg]:h-auto"
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Нажмите тип для предпросмотра
                </p>
              )
            ) : (
              <p className="text-xs text-muted-foreground">
                Предпросмотр недоступен — рендер происходит на сервере при
                публикации
              </p>
            )}
          </div>

          {/* Template preview */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Шаблон</p>
            <pre className="text-xs font-mono bg-background border border-border rounded p-2 overflow-auto max-h-28 whitespace-pre-wrap break-all">
              {selected.template}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Закрыть
            </button>
            <button
              type="button"
              onClick={handleInsert}
              className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Вставить диаграмму
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
