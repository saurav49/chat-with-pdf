// src/app/chat/[chatId]/page.tsx
import React from "react";
import axios from "axios";
import ChatFormWrapper from "@/components/chat-form-wrapper";

type Props = { params: { chatId: string } };

export default async function ChatPage({ params }: Props) {
  const { chatId } = params;
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
    <div className="p-6 flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full items-center pb-16 px-4 pt-10">
        <h1 className="text-2xl">Chat ID: {chatId}</h1>
        <p>This is a simple test page for /chat/{chatId}</p>
      </div>
      <ChatFormWrapper />
    </div>
  );
}
