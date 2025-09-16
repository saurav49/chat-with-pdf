// app/api/ingest-pdf/route.ts
import { NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

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
    const blob = new Blob([buffer], {
      type: "application/pdf",
    });

    const loader = new WebPDFLoader(blob, {});
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const texts = await textSplitter.splitDocuments(docs);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("POST /api/ingest-pdf error:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
