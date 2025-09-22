// app/api/ingest-pdf/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { chat, doc } from "@/db/schema";
import path from "path";
import fs from "fs/promises";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

const fileQueue = new Queue("file-ingest", { connection });

function createCollectionName(chatId: number, name: string) {
  const base = name.replace(/[a-z0-9_\-]/gi, "_");
  return `chat_${chatId}_${Date.now()}_${base}`.slice(0, 120);
}

export async function POST(request: Request) {
  try {
    const contentType = (
      request.headers.get("content-type") || ""
    ).toLowerCase();
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Expected multipart/form-data with `file` field",
        },
        {
          status: 400,
        }
      );
    }
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json(
        {
          ok: false,
          error: "No file provided under field `file`",
        },
        {
          status: 400,
        }
      );
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = file
      ? (file as File).name
      : `upload_${new Date().getTime()}.pdf`;
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, {
      recursive: true,
    });

    const savedFileName = `${Date.now()}-${fileName}`;
    const savedFilePathName = path.join(uploadsDir, savedFileName);
    await fs.writeFile(savedFilePathName, buffer);

    const createdChat = await db
      .insert(chat)
      .values({
        name: fileName,
      })
      .returning({ id: chat.id });
    const chatId = createdChat[0]?.id;

    const collectionName = createCollectionName(chatId, fileName);

    const createdDoc = await db
      .insert(doc)
      .values({
        chatId,
        collectionName,
        fileName,
        mimeType: file ? file.type : "application/pdf",
        size: file ? file.size : 0,
      })
      .returning({ id: doc.id });
    const docId = createdDoc[0].id;

    await fileQueue.add(
      "ingest-pdf",
      JSON.stringify({
        filePath: savedFilePathName,
        chatId,
        collectionName,
        fileName,
        docId,
        mimeType: file.type || "application/pdf",
        size: (file as File)?.size ?? buffer?.length,
      })
    );
  } catch (err) {
    console.error("POST /api/ingest-pdf error:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
  return NextResponse.json({
    text: "Successfully embedded pdf",
  });
}
