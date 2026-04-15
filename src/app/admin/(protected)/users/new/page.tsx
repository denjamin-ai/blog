"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUserPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"reviewer" | "reader" | "author">("reader");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, role, password }),
      });

      if (res.ok) {
        router.push("/admin/users");
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError("Пользователь с таким никнеймом уже существует");
        } else {
          setError(data.error || "Ошибка сервера");
        }
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  const canSave = username.trim() && name.trim() && password.length >= 6;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Новый пользователь</h1>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Никнейм</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="nickname"
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
            placeholder="Иван Иванов"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Роль</label>
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "reviewer" | "reader" | "author")
            }
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="reader">Читатель</option>
            <option value="reviewer">Ревьер</option>
            <option value="author">Автор</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Пароль (минимум 6 символов)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Создать"}
          </button>
          <button
            onClick={() => router.back()}
            disabled={saving}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
