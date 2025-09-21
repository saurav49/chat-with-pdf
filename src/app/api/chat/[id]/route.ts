import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { chat, doc, message } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params?.id) {
      return NextResponse.json(
        { message: "Chat ID is requred" },
        { status: 400 }
      );
    }

    const chatId = Number(params.id);
    if (Number.isNaN(chatId) || chatId <= 0) {
      return NextResponse.json(
        {
          message: "Invalid chat ID",
        },
        {
          status: 400,
        }
      );
    }

    const chatRow = await db
      .select()
      .from(chat)
      .where(eq(chat.id, Number(params.id)));

    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(message.createdAt);

    const docs = await db
      .select()
      .from(doc)
      .where(eq(doc.chatId, chatId))
      .orderBy(doc.createdAt);

    if (!chatRow) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    const chatInfo = {
      ...chatRow[0],
      messages,
      docs,
    };

    return NextResponse.json(chatInfo);
  } catch (err) {
    console.error("GET /api/chats/[id] error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
