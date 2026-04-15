"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteUserButtonProps {
  id: string;
  name: string;
}

export default function DeleteUserButton({ id, name }: DeleteUserButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Удалить пользователя «${name}»? Это действие необратимо.`))
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Ошибка удаления");
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-danger hover:underline disabled:opacity-50"
    >
      {deleting ? "Удаление..." : "Удалить"}
    </button>
  );
}
