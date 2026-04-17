import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { ulid } from "ulid";
import { fileTypeFromBuffer } from "file-type";
import imageSize from "image-size";
import ffmpeg from "fluent-ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

ffmpeg.setFfprobePath(ffprobeInstaller.path);

const IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2 МБ
const VIDEO_MAX_SIZE = 10 * 1024 * 1024; // 10 МБ
const VIDEO_MAX_DURATION = 45; // секунды

const ALLOWED_TYPES: Record<string, { ext: string; kind: "image" | "video" }> =
  {
    "image/jpeg": { ext: ".jpg", kind: "image" },
    "image/png": { ext: ".png", kind: "image" },
    "image/webp": { ext: ".webp", kind: "image" },
    "video/mp4": { ext: ".mp4", kind: "video" },
    "video/webm": { ext: ".webm", kind: "video" },
  };

async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration ?? Infinity);
    });
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isAdmin && (!session.userId || session.userRole !== "author")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ранняя проверка Content-Length до буферизации файла (защита от DoS)
  // Используем максимальный предел (VIDEO_MAX_SIZE), тип определим после чтения magic bytes
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > VIDEO_MAX_SIZE) {
    return NextResponse.json(
      { error: "Максимальный размер — 10 МБ" },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Проверка реального типа файла по magic bytes (не по client-provided MIME)
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_TYPES[detected.mime]) {
    return NextResponse.json(
      { error: "Поддерживаются JPG, PNG, WebP, MP4, WebM" },
      { status: 400 },
    );
  }

  const { ext, kind } = ALLOWED_TYPES[detected.mime];

  // Type-specific size check после определения типа
  if (kind === "image" && buffer.byteLength > IMAGE_MAX_SIZE) {
    return NextResponse.json(
      { error: "Максимальный размер — 2 МБ" },
      { status: 400 },
    );
  }
  if (kind === "video" && buffer.byteLength > VIDEO_MAX_SIZE) {
    return NextResponse.json(
      { error: "Максимальный размер для видео — 10 МБ" },
      { status: 400 },
    );
  }

  // Определение размеров изображения
  let imageWidth: number | undefined;
  let imageHeight: number | undefined;
  if (kind === "image") {
    try {
      const dims = imageSize(buffer);
      imageWidth = dims.width;
      imageHeight = dims.height;
    } catch {
      // не критично — размеры опциональны
    }
  }

  // Валидация длительности видео через ffprobe
  let duration: number | undefined;
  if (kind === "video") {
    const tmpFilename = ulid() + ext;
    const tmpPath = path.join("/tmp", tmpFilename);
    try {
      await writeFile(tmpPath, buffer);
      duration = await getVideoDuration(tmpPath);
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
    if (duration > VIDEO_MAX_DURATION) {
      return NextResponse.json(
        { error: "Видео не должно быть длиннее 45 секунд" },
        { status: 400 },
      );
    }
  }

  const filename = ulid() + ext;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({
    url: `/uploads/${filename}`,
    type: kind,
    ...(duration !== undefined ? { duration } : {}),
    ...(imageWidth !== undefined ? { width: imageWidth, height: imageHeight } : {}),
  });
}
