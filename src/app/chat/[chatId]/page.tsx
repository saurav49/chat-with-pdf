// src/app/chat/[chatId]/page.tsx
import React from "react";
import axios from "axios";
import { ChatWrapper } from "@/components/chat-wrapper";

type Props = { params: { chatId: string } };

export type DocProps = {
  id: number;
  chatId: number;
  collectionName: string;
  fileName: string;
  mimeType: string | null;
  size: number | null;
  createdAt: Date;
};

export type MessageProps = {
  id?: string;
  chatId: string;
  content: string;
  role: "user" | "system" | "assistant";
};

export type ChatSessionProps = {
  id: number;
  name: string;
  messages: MessageProps[];
  docs: DocProps[];
};

export default async function ChatPage({ params }: Props) {
  const { chatId } = await params;
  const res = await axios.get(`${process.env.BASE_URL}/chat/${chatId}`);
  if (res.status !== 200) {
    return (
      <div className="p-6">
        <h1 className="text-2xl">Chat ID: {chatId}</h1>
        <p>Page not found</p>
      </div>
    );
  }
  return (
    <div className="p-6 mt-2 flex flex-col items-center justify-center w-full overflow-y-scroll">
      {/* <div className="flex flex-col w-full items-center pb-16 px-4 pt-10">
        <h1 className="text-2xl">Chat ID: {chatId}</h1>
        <p>This is a simple test page for /chat/{chatId}</p>
      </div> */}
      <ChatWrapper chatId={chatId} data={res?.data} />
    </div>
  );
}
