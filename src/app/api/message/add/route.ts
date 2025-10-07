import { db } from "@/db/drizzle";
import { message } from "@/db/schema";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { systemPrompt } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";
import { CallbackManager } from "@langchain/core/callbacks/manager";

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

    await db.insert(message).values({
      chatId: +data.chatId,
      content: data.content,
      role: data.role,
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
    const encoder = new TextEncoder();
    const userQueries = existingMessages.map((m) => ({
      role: "user",
      content: m.content,
    }));
    userQueries.push({
      role: "user",
      content: data.content,
    });
    const messageForLLM = [
      {
        role: "system",
        content: systemPrompt(relevantChunks),
      },
      ...userQueries,
    ];
    const stream = new ReadableStream({
      async start(controller) {
        let accumulated = "";

        const chat = new ChatOpenAI({
          model: process.env.MODEL_NAME,
          temperature: 0,
          streaming: true,
          callbackManager: CallbackManager.fromHandlers({
            async handleLLMNewToken(token: string) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "token", text: token }) + "\n"
                )
              );
              accumulated += token;
            },
            async handleLLMError(err: any) {
              console.error("LLM error callback:", err);
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "error", message: String(err) }) + "\n"
                )
              );
            },
          }),
        });

        try {
          await chat.invoke(messageForLLM);
          let parsedFinal: any = null;
          try {
            parsedFinal = JSON.parse(accumulated);
          } catch {
            parsedFinal = accumulated;
          }
          const formatted = formatParsedLLM(parsedFinal);
          try {
            await db.insert(message).values({
              chatId: +data.chatId,
              content: formatted,
              role: "assistant",
            });
          } catch (dbErr) {
            console.error("DB insert failed:", dbErr);
          }
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "done" }) + "\n")
          );
          controller.close();
        } catch (err) {
          console.error("Streaming invocation error:", err);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "error", message: String(err) }) + "\n"
            )
          );
          controller.close();
        }
      },
      cancel(reason) {
        console.log("stream cancelled:", reason);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("POST /api/message/add error:", err);
    return new Response(
      JSON.stringify({
        OK: false,
        error: "Internal server error",
        status: 500,
        headers: {
          "Content-type": "application/json",
        },
      })
    );
  }
}
