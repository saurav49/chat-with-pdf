import { Worker } from "bullmq";
import IORedis from "ioredis";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

export const worker = new Worker(
  "file-ingest",
  async (job) => {
    if (job.name === "ingest-pdf") {
      const data = JSON.parse(job.data);

      const loader = new PDFLoader(data.filePath);
      const docs = await loader.load();

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await textSplitter.splitDocuments(docs);

      const docsWithMetadata = splitDocs.map((doc, idx) => ({
        pageContent: doc.pageContent,
        metadata: {
          chatId: data.chatId,
          docId: data.docId,
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
          collectionName: data.collectionName,
        }
      );
      await vectorStore.addDocuments(docsWithMetadata);
    }
  },
  { concurrency: 100, connection }
);
