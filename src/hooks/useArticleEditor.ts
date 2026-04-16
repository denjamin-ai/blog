"use client";

import { useRef, useState, useCallback } from "react";

interface MediaPreview {
  url: string;
  type: "image" | "video";
  name: string;
  duration?: number;
}

export function useArticleEditor(
  content: string,
  setContent: (updater: string | ((prev: string) => string)) => void,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef<number>(content.length);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [mediaUploadError, setMediaUploadError] = useState("");
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);

  const insertAtCursor = useCallback(
    (text: string) => {
      const pos = cursorPosRef.current;
      setContent(
        (prev) => prev.slice(0, pos) + "\n" + text + "\n" + prev.slice(pos),
      );
      cursorPosRef.current = pos + text.length + 2;
    },
    [setContent],
  );

  const insertMediaTag = useCallback(
    (url: string, type: "image" | "video") => {
      const tag =
        type === "image"
          ? `<ArticleImage src="${url}" alt="" />`
          : `<ArticleVideo src="${url}" />`;
      insertAtCursor(tag);
      setMediaPreview(null);
    },
    [insertAtCursor],
  );

  const handleMediaUpload = useCallback(async (file: File) => {
    setUploadingMedia(true);
    setMediaUploadProgress(0);
    setMediaUploadError("");
    setMediaPreview(null);

    const formData = new FormData();
    formData.append("file", file);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setMediaUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        let data: {
          url?: string;
          type?: string;
          duration?: number;
          error?: string;
        } = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          // ignore
        }
        if (xhr.status === 200 && data.url) {
          setMediaPreview({
            url: data.url,
            type: (data.type as "image" | "video") ?? "image",
            name: file.name,
            duration: data.duration,
          });
        } else {
          setMediaUploadError(data.error ?? "Ошибка загрузки");
        }
        resolve();
      };
      xhr.onerror = () => {
        setMediaUploadError("Ошибка сети");
        resolve();
      };
      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });

    setUploadingMedia(false);
  }, []);

  const trackCursor = useCallback(() => {
    cursorPosRef.current =
      textareaRef.current?.selectionStart ?? content.length;
  }, [content]);

  return {
    textareaRef,
    cursorPosRef,
    mediaFileInputRef,
    uploadingMedia,
    mediaUploadProgress,
    mediaUploadError,
    mediaPreview,
    setMediaPreview,
    insertAtCursor,
    insertMediaTag,
    handleMediaUpload,
    trackCursor,
  };
}
