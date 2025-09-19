// app/api/ingest-pdf/route.ts
import { NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { db } from "@/db/drizzle";
import { chat, message, doc } from "@/db/schema";

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
    const blob = new Blob([buffer], {
      type: "application/pdf",
    });

    const fileName = file
      ? (file as File).name
      : `upload_${new Date().getTime()}.pdf`;

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

    const loader = new WebPDFLoader(blob, {});
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    const docsWithMetadata = splitDocs.map((doc, idx) => ({
      pageContent: doc.pageContent,
      metadata: {
        chatId: chatId,
        docId: docId,
        chunkIndex: idx,
      },
    }));

    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-small",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        collectionName: collectionName,
      }
    );
    await vectorStore.addDocuments(docsWithMetadata);
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
