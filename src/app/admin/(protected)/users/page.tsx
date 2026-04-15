import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";
import Link from "next/link";
import DeleteUserButton from "./delete-button";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      isBlocked: users.isBlocked,
      commentingBlocked: users.commentingBlocked,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Создать пользователя
        </Link>
      </div>

      {allUsers.length === 0 ? (
        <p className="text-muted-foreground">Пользователей пока нет.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Имя</th>
                <th className="px-4 py-3 font-medium">Никнейм</th>
                <th className="px-4 py-3 font-medium">Роль</th>
                <th className="px-4 py-3 font-medium">Создан</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-border hover:bg-elevated transition-colors even:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {user.name}
                    </Link>
                    {(user.isBlocked === 1 || user.commentingBlocked === 1) && (
                      <div className="flex gap-1.5 mt-0.5">
                        {user.isBlocked === 1 && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-danger-bg text-danger">
                            Заблокирован
                          </span>
                        )}
                        {user.commentingBlocked === 1 && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-bg text-warning">
                            Без комментариев
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.username}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "reviewer"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : user.role === "author"
                            ? "bg-accent/15 text-accent"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.role === "reviewer"
                        ? "Ревьюер"
                        : user.role === "author"
                          ? "Автор"
                          : "Читатель"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.createdAt * 1000).toLocaleDateString(
                      "ru-RU",
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        Редактировать
                      </Link>
                      <DeleteUserButton id={user.id} name={user.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
