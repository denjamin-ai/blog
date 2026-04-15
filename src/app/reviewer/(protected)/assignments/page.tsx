import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewAssignments, articles } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Status = "pending" | "accepted" | "declined" | "completed";

const STATUS_LABELS: Record<Status, string> = {
  pending: "Ожидает",
  accepted: "Принято",
  declined: "Отклонено",
  completed: "Завершено",
};

const STATUS_COLORS: Record<Status, string> = {
  pending: "bg-warning-bg text-warning",
  accepted: "bg-info-bg text-info",
  declined: "bg-danger-bg text-danger",
  completed: "bg-success-bg text-success",
};

const FILTER_TABS: { label: string; value: string }[] = [
  { label: "Все", value: "" },
  { label: "Ожидают", value: "pending" },
  { label: "В работе", value: "accepted" },
  { label: "Отклонено", value: "declined" },
  { label: "Завершено", value: "completed" },
];

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  let session;
  try {
    session = await requireUser("reviewer");
  } catch (err) {
    if (err instanceof Response) redirect("/login");
    throw err;
  }

  const { status: statusFilter } = await searchParams;

  const conditions = [eq(reviewAssignments.reviewerId, session.userId!)];
  if (
    statusFilter &&
    ["pending", "accepted", "declined", "completed"].includes(statusFilter)
  ) {
    conditions.push(eq(reviewAssignments.status, statusFilter as Status));
  }

  const rows = await db
    .select({
      id: reviewAssignments.id,
      status: reviewAssignments.status,
      createdAt: reviewAssignments.createdAt,
      updatedAt: reviewAssignments.updatedAt,
      articleTitle: articles.title,
      articleId: reviewAssignments.articleId,
    })
    .from(reviewAssignments)
    .leftJoin(articles, eq(reviewAssignments.articleId, articles.id))
    .where(and(...conditions))
    .orderBy(desc(reviewAssignments.createdAt));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Назначения</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {FILTER_TABS.map((tab) => {
          const isActive = (statusFilter ?? "") === tab.value;
          const href = tab.value
            ? `/reviewer/assignments?status=${tab.value}`
            : "/reviewer/assignments";
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            viewBox="0 0 24 24"
            className="w-12 h-12 text-muted-foreground/40 mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <p className="text-muted-foreground text-sm">Нет назначений</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const st = row.status as Status;
            return (
              <Link
                key={row.id}
                href={`/reviewer/assignments/${row.id}`}
                className="block p-5 border border-border rounded-xl hover:bg-elevated transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {row.articleTitle ?? "Без названия"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Назначено {formatDate(row.createdAt)}
                      {row.updatedAt !== row.createdAt && (
                        <> · Обновлено {formatDate(row.updatedAt)}</>
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[st]}`}
                  >
                    {STATUS_LABELS[st]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
