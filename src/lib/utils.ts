import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import IORedis from "ioredis";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function systemPrompt(relevantChunks: string) {
  return `You are a helpful AI assistant who specialize in resolving user query.
    Given a user prompt and relevant chunks from a vector DB, you resolve the user query
    The relevant chunks are the context based on which you resolve the user query

    Rules:
    1. Follow the strict JSON output as per Output schema.
    2. First, check if the answer can be found in the provided context
    3. If the context doesnt contain the answer, use your general knowledge to answer
    
    context:
    ${relevantChunks}
    `;
}

export { systemPrompt };
