import { db } from "@/db/drizzle";
import { message } from "@/db/schema";
import { NextResponse } from "next/server";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { systemPrompt } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";

function formatParsedLLM(parsed: any): string {
  if (!parsed) return "";

  if (typeof parsed === "string") return parsed;

  if (typeof parsed.answer === "string") return parsed.answer;

  if (Array.isArray(parsed.steps)) {
    const mdSteps = parsed.steps
      .map((s: any, i: number) => {
        const title = s.step ?? `Step ${i + 1}`;
        const desc = s.description ? `\n\n${s.description}\n\n` : "\n\n";
        const code = s.code ? `\`\`\`javascript\n${s.code}\n\`\`\`\n\n` : "";
        return `### ${i + 1}. ${title}\n\n${desc}${code}`;
      })
      .join("\n");

    const note = parsed.note ? `---\n\n${parsed.note}\n` : "";
    return `${mdSteps}\n${note}`.trim();
  }

  if (typeof parsed.note === "string") return parsed.note;
  try {
    return "```\n" + JSON.stringify(parsed, null, 2) + "\n```";
  } catch {
    return String(parsed);
  }
}

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
    let res;
    try {
      res = JSON.parse(llmResponse.content as string);
    } catch {
      res = llmResponse.content;
    }
    const llmR = formatParsedLLM(res);
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
