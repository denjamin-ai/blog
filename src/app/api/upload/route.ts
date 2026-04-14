import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ulid } from "ulid";
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_SIZE = 2 * 1024 * 1024; // 2 МБ

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isAdmin && (!session.userId || session.userRole !== "author")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ранняя проверка Content-Length до буферизации файла (защита от DoS)
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_SIZE) {
    return NextResponse.json(
      { error: "Максимальный размер — 2 МБ" },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_SIZE) {
    return NextResponse.json(
      { error: "Максимальный размер — 2 МБ" },
      { status: 400 },
    );
  }

  // Проверка реального типа файла по magic bytes (не по client-provided MIME)
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_TYPES[detected.mime]) {
    return NextResponse.json(
      { error: "Поддерживаются JPG, PNG, WebP" },
      { status: 400 },
    );
  }

  const ext = ALLOWED_TYPES[detected.mime];
  const filename = ulid() + ext;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
