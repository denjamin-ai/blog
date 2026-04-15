import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewAssignments } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидают",
  accepted: "В работе",
  completed: "Завершено",
};

export default async function ReviewerDashboard() {
  let session;
  try {
    session = await requireUser("reviewer");
  } catch (err) {
    if (err instanceof Response) redirect("/login");
    throw err;
  }

  const countsByStatus = await db
    .select({ status: reviewAssignments.status, count: count() })
    .from(reviewAssignments)
    .where(eq(reviewAssignments.reviewerId, session.userId!))
    .groupBy(reviewAssignments.status);

  const pending =
    countsByStatus.find((r) => r.status === "pending")?.count ?? 0;
  const accepted =
    countsByStatus.find((r) => r.status === "accepted")?.count ?? 0;
  const completed =
    countsByStatus.find((r) => r.status === "completed")?.count ?? 0;

  const stats = [
    {
      label: STATUS_LABELS.pending,
      value: pending,
      href: "/reviewer/assignments?status=pending",
    },
    {
      label: STATUS_LABELS.accepted,
      value: accepted,
      href: "/reviewer/assignments?status=accepted",
    },
    {
      label: STATUS_LABELS.completed,
      value: completed,
      href: "/reviewer/assignments?status=completed",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Панель ревьера</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ваши назначения на проверку статей
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="p-5 bg-elevated border border-border rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="text-3xl font-display font-bold mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
