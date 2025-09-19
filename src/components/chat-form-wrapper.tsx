"use client";
import React, { useState } from "react";
import { AutoResizeTextarea } from "./auto-resize-textarea";
import TooltipWrapper from "./tooltip-wrapper";
import { Button } from "./ui/button";
import { ArrowUp } from "lucide-react";

function ChatFormWrapper() {
  const [userQuery, setUserQuery] = useState("");
  const isDisabledBtn = userQuery.length === 0;
  return (
    <form className="fixed bottom-0 border border-slate-800 w-[600px] rounded-md py-2 px-2 ">
      <AutoResizeTextarea userQuery={userQuery} setUserQuery={setUserQuery} />
      <div className="flex w-full items-center flex-row-reverse dark:bg-input/30 px-2 pb-2 rounded-bl-md rounded-br-md">
        <TooltipWrapper
          trigger={
            <Button
              variant={"ghost"}
              className={`${
                isDisabledBtn ? "cursor-not-allowed" : "cursor-pointer"
              }  inline-flex py-1 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-sm text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50`}
              disabled={isDisabledBtn}
            >
              <ArrowUp />
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
