// // src/app/chat/[chatId]/page.tsx
import React from "react";
import axios from "axios";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/auto-resize-textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <form className="fixed bottom-0 border border-slate-800 w-[600px] rounded-md py-2 px-2 ">
        <AutoResizeTextarea />
        <div className="flex w-full items-center flex-row-reverse dark:bg-input/30 px-2 pb-2 rounded-bl-md rounded-br-md">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant={"ghost"}
                className="cursor-pointer inline-flex py-1 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-sm text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
              >
                <ArrowUp />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="text-xs">send message</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </form>
    </div>
  );
}
