"use client";

import { useState, useEffect } from "react";

interface BlogProfile {
  name: string;
  bio: string;
  avatarUrl: string | null;
  links: { github?: string; telegram?: string; website?: string };
  defaultOgImage: string | null;
}

export function BlogProfileEditor() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [github, setGithub] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [defaultOgImage, setDefaultOgImage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings/profile")
      .then((r) => r.json())
      .then((data: BlogProfile) => {
        setName(data.name ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatarUrl ?? "");
        setGithub(data.links?.github ?? "");
        setTelegram(data.links?.telegram ?? "");
        setWebsite(data.links?.website ?? "");
        setDefaultOgImage(data.defaultOgImage ?? "");
      })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoaded(true));
  }, []);

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    setUploading: (v: boolean) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setter(url);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Ошибка загрузки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setUploading(false);
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

      const res = await fetch("/api/admin/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl || null,
          links,
          defaultOgImage: defaultOgImage || null,
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
    return <p className="text-sm text-muted-foreground">Загрузка...</p>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">Название блога</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Описание блога{" "}
          <span className="text-muted-foreground font-normal text-xs">
            (meta description, OG)
          </span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Аватар блога</label>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Аватар"
              className="w-16 h-16 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted border border-border" />
          )}
          <div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                handleUpload(e, setAvatarUrl, setUploadingAvatar)
              }
              disabled={uploadingAvatar}
              className="text-sm text-muted-foreground file:mr-3 file:px-3 file:py-1.5 file:border file:border-border file:rounded-lg file:text-sm file:bg-muted file:text-foreground hover:file:bg-muted/80 file:cursor-pointer disabled:opacity-50"
            />
            {uploadingAvatar && (
              <p className="text-xs text-muted-foreground mt-1">Загрузка...</p>
            )}
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="text-xs text-danger hover:opacity-70 mt-1 block"
              >
                Удалить
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Default OG-изображение{" "}
          <span className="text-muted-foreground font-normal text-xs">
            (используется когда у статьи нет обложки)
          </span>
        </label>
        <div className="space-y-2">
          {defaultOgImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaultOgImage}
              alt="OG"
              className="h-20 rounded object-cover border border-border"
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) =>
              handleUpload(e, setDefaultOgImage, setUploadingOgImage)
            }
            disabled={uploadingOgImage}
            className="text-sm text-muted-foreground file:mr-3 file:px-3 file:py-1.5 file:border file:border-border file:rounded-lg file:text-sm file:bg-muted file:text-foreground hover:file:bg-muted/80 file:cursor-pointer disabled:opacity-50"
          />
          {uploadingOgImage && (
            <p className="text-xs text-muted-foreground">Загрузка...</p>
          )}
          {defaultOgImage && (
            <button
              type="button"
              onClick={() => setDefaultOgImage("")}
              className="text-xs text-danger hover:opacity-70"
            >
              Удалить
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Ссылки</label>
        <div className="space-y-3">
          {[
            { label: "GitHub", value: github, setter: setGithub },
            { label: "Telegram", value: telegram, setter: setTelegram },
            { label: "Сайт", value: website, setter: setWebsite },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="block text-xs text-muted-foreground mb-1">
                {label}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={`https://...`}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
      {success && <p className="text-success text-sm">Настройки сохранены</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? "Сохранение..." : "Сохранить"}
      </button>
    </form>
  );
}
