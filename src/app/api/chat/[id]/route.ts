import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { chat } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!params?.id) {
    return NextResponse.json(
      { message: "Chat ID is requred" },
      { status: 400 }
    );
  }

  const res = await db
    .select()
    .from(chat)
    .where(eq(chat.id, Number(params.id)));

  if (!res) {
    return NextResponse.json({ message: "Chat not found" }, { status: 404 });
  }

  return NextResponse.json(res);
}
