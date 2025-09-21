"use client";

import { useState } from "react";
import ChatFormWrapper from "./chat-form-wrapper";
import { ChatInterface } from "./chat-interface";
import { ChatSessionProps } from "@/app/chat/[chatId]/page";

export function ChatWrapper({
  chatId,
  data,
}: {
  chatId: string;
  data: ChatSessionProps;
}) {
  const [chatSession, setChatSession] = useState<ChatSessionProps | null>(data);
  return (
    <div className="flex flex-col items-center">
      <ChatInterface chatSession={chatSession} />
      <ChatFormWrapper
        chatId={chatId}
        setChatSession={setChatSession}
        chatSession={chatSession}
      />
    </div>
  );
}
