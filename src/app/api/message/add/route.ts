import { db } from "@/db/drizzle";
import { message } from "@/db/schema";
import { NextResponse } from "next/server";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { systemPrompt } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as {
      chatId: string;
      content: string;
      role: "user" | "system" | "assistant";
      collectionName: string;
    };
    const existingMessages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, +data.chatId))
      .orderBy(desc(message.createdAt))
      .limit(10);

    await db
      .insert(message)
      .values({
        chatId: +data.chatId,
        content: data.content,
        role: data.role,
      })
      .returning({
        id: message.id,
        content: message.content,
        role: message.role,
        createdAt: message.createdAt,
      });

    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: "text-embedding-3-small",
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        collectionName: data.collectionName,
      }
    );
    const similaritySearchResults = await vectorStore.similaritySearch(
      data.content
    );

    const relevantChunks = similaritySearchResults.reduce((acc, currValue) => {
      acc += `Page ${currValue.pageContent} [${JSON.stringify(
        currValue.metadata,
        null
      )}]`;
      return acc;
    }, "");
    const llm = new ChatOpenAI({
      model: process.env.MODEL_NAME,
      temperature: 0,
    });
    const userQueries = existingMessages.map((m) => ({
      role: "user",
      content: m.content,
    }));
    userQueries.push({
      role: "user",
      content: data.content,
    });
    const llmResponse = await llm.invoke([
      {
        role: "system",
        content: systemPrompt(relevantChunks),
      },
      ...userQueries,
    ]);
    const llmR = JSON.parse(llmResponse.content as string)?.answer;
    const llmMsg = await db
      .insert(message)
      .values({
        chatId: +data.chatId,
        content: llmR as string,
        role: "assistant",
      })
      .returning({
        id: message.id,
        role: message.role,
        content: message.content,
        chatId: message.chatId,
      });
    return NextResponse.json(
      {
        ok: true,
        message: "Message added",
        data: llmMsg[0],
      },
      {
        status: 201,
      }
    );
  } catch (err) {
    console.error("POST /api/message/add error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
