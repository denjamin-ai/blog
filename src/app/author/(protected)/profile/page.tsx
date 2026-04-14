"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AuthorProfile {
  name: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  links: { github?: string; telegram?: string; website?: string };
  slug: string | null;
}

export default function AuthorProfilePage() {
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [github, setGithub] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    fetch("/api/author/profile")
      .then((r) => r.json())
      .then((data: AuthorProfile) => {
        setProfile(data);
        setDisplayName(data.displayName ?? data.name ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatarUrl ?? "");
        setGithub(data.links?.github ?? "");
        setTelegram(data.links?.telegram ?? "");
        setWebsite(data.links?.website ?? "");
        setSlug(data.slug ?? "");
      })
      .catch(() => setError("Ошибка загрузки профиля"))
      .finally(() => setLoaded(true));
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setAvatarUrl(url);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ошибка загрузки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const links: Record<string, string> = {};
      if (github.trim()) links.github = github.trim();
      if (telegram.trim()) links.telegram = telegram.trim();
      if (website.trim()) links.website = website.trim();

      const res = await fetch("/api/author/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim() || null,
          avatarUrl: avatarUrl || null,
          links,
          slug: slug.trim() || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ошибка сохранения");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return <div className="text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Профиль автора</h1>
        {slug && (
          <Link
            href={`/authors/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            Публичная страница →
          </Link>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Аватар */}
        <div>
          <label className="block text-sm font-medium mb-2">Аватар</label>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Аватар"
                className="w-20 h-20 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center text-2xl text-muted-foreground">
                {displayName?.[0]?.toUpperCase() ??
                  profile?.name?.[0]?.toUpperCase() ??
                  "?"}
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="text-sm text-muted-foreground file:mr-3 file:px-3 file:py-1.5 file:border file:border-border file:rounded-lg file:text-sm file:bg-muted file:text-foreground hover:file:bg-muted/80 file:cursor-pointer disabled:opacity-50"
              />
              {uploadingAvatar && (
                <p className="text-xs text-muted-foreground mt-1">
                  Загрузка...
                </p>
              )}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="text-xs text-red-500 hover:opacity-70 mt-1 block"
                >
                  Удалить аватар
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Отображаемое имя */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Отображаемое имя <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={100}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-1">
            О себе{" "}
            <span className="text-muted-foreground font-normal">
              ({bio.length}/500)
            </span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Расскажите о себе..."
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Slug публичной страницы
          </label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">/authors/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              maxLength={100}
              placeholder="your-name"
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Только строчные буквы, цифры и дефисы
          </p>
        </div>

        {/* Ссылки */}
        <div>
          <label className="block text-sm font-medium mb-3">Ссылки</label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                GitHub
              </label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Telegram
              </label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="https://t.me/username"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Личный сайт
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && (
          <p className="text-green-600 dark:text-green-400 text-sm">
            Профиль сохранён
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </form>
    </div>
  );
}
