import { db } from "@/db/drizzle";
import { doc } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await db.select().from(doc);
    return NextResponse.json(
      {
        ok: true,
        data: res,
      },
      {
        status: 200,
      }
    );
  } catch (e) {
    console.error("POST /api/get-chats error:", e);
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
