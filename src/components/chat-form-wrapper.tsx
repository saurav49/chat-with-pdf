"use client";
import React, { TextareaHTMLAttributes, useState } from "react";
import { AutoResizeTextarea } from "./auto-resize-textarea";
import TooltipWrapper from "./tooltip-wrapper";
import { Button } from "./ui/button";
import { ArrowUp } from "lucide-react";
import axios from "axios";
import { MessageProps, ChatSessionProps } from "@/app/chat/[chatId]/page";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";

function ChatFormWrapper({
  chatId,
  setChatSession,
  chatSession,
}: {
  chatId: string;
  setChatSession: React.Dispatch<React.SetStateAction<ChatSessionProps | null>>;
  chatSession: ChatSessionProps | null;
}) {
  const router = useRouter();
  const [userQuery, setUserQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isDisabledBtn = userQuery.length === 0;
  async function handleSubmitButton(e: any) {
    e.preventDefault();
    setIsLoading(true);
    const message: MessageProps & { collectionName: string } = {
      chatId: chatId,
      content: userQuery,
      role: "user",
      collectionName:
        chatSession && Array.isArray(chatSession?.messages)
          ? chatSession.docs[0]?.collectionName
          : ``,
    };
    try {
      setUserQuery("");
      setChatSession((prevState) =>
        prevState
          ? {
              ...prevState,
              messages: [...prevState.messages, message],
            }
          : null
      );
      if (chatSession && Array.isArray(chatSession?.messages)) {
        const r = await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/message/add`,
          message
        );
        if (r?.data?.data?.id) {
          setChatSession((prevState) =>
            prevState
              ? {
                  ...prevState,
                  messages: [
                    ...prevState.messages,
                    {
                      id: r?.data?.data?.id,
                      chatId: r?.data?.data?.chatId,
                      content: r?.data?.data?.content,
                      role: r?.data?.data?.role,
                      collectionName: chatSession.docs[0]?.collectionName,
                    },
                  ],
                }
              : null
          );
        }
        router.refresh();
      }
    } catch (e) {
      setChatSession((prevState) =>
        prevState
          ? {
              ...prevState,
              messages: prevState.messages.filter(
                (m) => m.chatId !== message.chatId
              ),
            }
          : null
      );
    } finally {
      setIsLoading(false);
    }
  }
  async function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key.toLowerCase() === "enter" && !e.shiftKey) {
      e.preventDefault();
      await handleSubmitButton(e);
    }
  }
  return (
    <form
      className="fixed bottom-0 border border-slate-800 w-[720px] rounded-md py-2 px-2 bg-accent"
      onSubmit={handleSubmitButton}
      onKeyDown={handleKeyDown}
    >
      <AutoResizeTextarea userQuery={userQuery} setUserQuery={setUserQuery} />
      <div className="flex w-full items-center flex-row-reverse dark:bg-input/30 px-2 pb-2 rounded-bl-md rounded-br-md">
        <TooltipWrapper
          trigger={
            <Button
              variant={"ghost"}
              className={`${
                isDisabledBtn || isLoading
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }  inline-flex py-1 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-sm text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 w-[62px]`}
              disabled={isDisabledBtn || isLoading}
              type="submit"
            >
              {isLoading ? <ClipLoader color="#fff" size={12} /> : <ArrowUp />}
            </Button>
          }
          content={
            isDisabledBtn ? (
              <span className="text-xs">Message requires text</span>
            ) : (
              <span className="text-xs">Send message</span>
            )
          }
        />
      </div>
    </form>
  );
}

export default ChatFormWrapper;
