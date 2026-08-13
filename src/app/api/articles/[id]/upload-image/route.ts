import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { canEditArticleRecord } from "@/lib/articles/access";
import { areLocalUploadsEnabled } from "@/lib/articles/local-uploads";
import { getArticleById, toAccessRecord } from "@/lib/articles/store";
import { requireSession } from "@/lib/auth/guards";

const MAX_BYTES = 5 * 1024 * 1024;

function isPng(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  );
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    if (!areLocalUploadsEnabled()) {
      return NextResponse.json(
        {
          error:
            "Image uploads are disabled in this environment. Local filesystem storage is not durable on Vercel; use checked-in /figures assets until object storage is available.",
        },
        { status: 403 },
      );
    }

    const { id: articleId } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(articleId)) {
      return NextResponse.json({ error: "Invalid article id." }, { status: 400 });
    }

    const user = await requireSession();
    const article = await getArticleById(articleId);

    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    if (!canEditArticleRecord(user.permissions, user.id, toAccessRecord(article))) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 5 MB limit." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extension: "png" | "jpg" | null = null;
    if (isPng(buffer)) extension = "png";
    else if (isJpeg(buffer)) extension = "jpg";

    if (!extension) {
      return NextResponse.json({ error: "Only PNG and JPEG images are allowed." }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}.${extension}`;
    const relativeDir = path.join("uploads", "articles", articleId);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);
    await mkdir(absoluteDir, { recursive: true });
    await writeFile(path.join(absoluteDir, filename), buffer);

    const src = `/${relativeDir.replace(/\\/g, "/")}/${filename}`;
    return NextResponse.json({ src });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
