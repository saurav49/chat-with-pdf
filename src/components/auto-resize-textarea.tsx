"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";

export function AutoResizeTextarea() {
  const [userQuery, setUserQuery] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "80px";

    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = newHeight + "px";
  };

  return (
    <Textarea
      ref={textareaRef}
      placeholder="Type your message here..."
      value={userQuery}
      onChange={(e) => setUserQuery(e.target.value)}
      onInput={handleInput}
      className="border-none text-sm focus:outline-none rounded-tr-md rounded-tl-md rounded-br-none rounded-bl-none"
      style={{
        height: "80px",
        maxHeight: "200px",
        resize: "none",
        overflow: "auto", // adds scrollbar if content > 120px
      }}
    />
  );
}
