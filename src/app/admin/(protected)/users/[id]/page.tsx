"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Role = "reviewer" | "reader" | "author";

interface AuthorArticle {
  id: string;
  title: string;
  status: "draft" | "published" | "scheduled";
  publishedAt: number | null;
  viewCount: number;
}

function AuthorArticles({ userId }: { userId: string }) {
  const [articles, setArticles] = useState<AuthorArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/articles`);
    if (res.ok) {
      const data = await res.json();
      setArticles(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleVisibility(articleId: string, currentStatus: string) {
    setToggling(articleId);
    const action = currentStatus === "published" ? "hide" : "show";
    await fetch(`/api/admin/articles/${articleId}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
    setToggling(null);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка статей...</p>;
  }

  if (articles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">У автора нет статей.</p>
    );
  }

  return (
    <div className="space-y-2">
      {articles.map((article) => {
        const isPublished = article.status === "published";
        const busy = toggling === article.id;
        return (
          <div
            key={article.id}
            className="flex items-center gap-3 p-3 border border-border rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <Link
                href={`/admin/articles/${article.id}`}
                className="text-sm font-medium hover:text-accent transition-colors truncate block"
              >
                {article.title}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    isPublished
                      ? "bg-success-bg text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isPublished
                    ? "опубликована"
                    : article.status === "scheduled"
                      ? "запланирована"
                      : "черновик"}
                </span>
                {article.viewCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {article.viewCount} просм.
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => toggleVisibility(article.id, article.status)}
              disabled={busy || article.status === "scheduled"}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                isPublished
                  ? "border-danger text-danger hover:bg-danger-bg"
                  : "border-success text-success hover:bg-success-bg"
              }`}
            >
              {busy ? "..." : isPublished ? "Скрыть" : "Опубликовать"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("reader");
  const [password, setPassword] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [commentingBlocked, setCommentingBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadUser = useCallback(async () => {
    const res = await fetch(`/api/admin/users/${id}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        res.status === 404
          ? "Пользователь не найден"
          : (data.error ?? "Ошибка загрузки"),
      );
      setLoadFailed(true);
      setLoaded(true);
      return;
    }
    const data = await res.json();
    setUsername(data.username);
    setName(data.name);
    setRole(data.role);
    setIsBlocked(data.isBlocked === 1);
    setCommentingBlocked(data.commentingBlocked === 1);
    setLoaded(true);
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function handleSave() {
    setError("");
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name,
        username,
        isBlocked: isBlocked ? 1 : 0,
        commentingBlocked: commentingBlocked ? 1 : 0,
      };
      if (password) body.password = password;

      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setPassword("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError("Никнейм уже занят другим пользователем");
        } else {
          setError(data.error ?? "Ошибка сохранения");
        }
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Удалить пользователя «${name}»? Это действие необратимо.`))
      return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/users");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Ошибка удаления");
      }
    } catch {
      setError("Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  }

  if (!loaded) {
    return <div className="text-muted-foreground">Загрузка...</div>;
  }

  if (loadFailed) {
    return <p className="text-danger">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Редактирование пользователя</h1>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Никнейм</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            От 4 до 50 символов, только латинские буквы и цифры
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Имя</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Роль</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="reader">Читатель</option>
            <option value="reviewer">Ревьер</option>
            <option value="author">Автор</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Новый пароль (оставьте пустым, чтобы не менять)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="••••••••"
          />
        </div>

        {/* Блокировки: зависят от роли */}
        {role === "author" && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Настройки автора
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
                className="w-4 h-4 accent-red-500"
              />
              <span className="text-sm">
                Скрыть публикации автора с сайта
                {isBlocked && (
                  <span className="ml-2 text-xs text-danger font-medium">
                    (активно)
                  </span>
                )}
              </span>
            </label>
            {isBlocked && (
              <p className="text-xs text-muted-foreground pl-7">
                Все опубликованные статьи этого автора будут скрыты и переведены
                в черновики. Автор сможет войти в систему и работать.
              </p>
            )}
          </div>
        )}

        {role === "reader" && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Настройки читателя
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={commentingBlocked}
                onChange={(e) => setCommentingBlocked(e.target.checked)}
                className="w-4 h-4 accent-red-500"
              />
              <span className="text-sm">
                Запретить оставлять комментарии
                {commentingBlocked && (
                  <span className="ml-2 text-xs text-danger font-medium">
                    (активно)
                  </span>
                )}
              </span>
            </label>
          </div>
        )}

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving || deleting}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <button
            onClick={() => router.push("/admin/users")}
            disabled={saving || deleting}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 ml-auto"
          >
            {deleting ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>

      {/* Статьи автора */}
      {role === "author" && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">Статьи автора</h2>
          <AuthorArticles userId={id} />
        </div>
      )}
    </div>
  );
}
