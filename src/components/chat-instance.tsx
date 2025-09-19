"use client";
import React from "react";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { ChatType } from "./app-sidebar";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function ChatInstance({ chat }: { chat: ChatType }) {
  const pathname = usePathname();
  const chatId = pathname.split("/chat/")[1];
  return (
    <Tooltip>
      <TooltipTrigger>
        <SidebarMenuItem
          key={chat.id}
          className={`${
            chatId === String(chat.id) ? "bg-accent text-white" : ""
          } rounded-md p-1 hover:bg-accent hover:text-white`}
        >
          <SidebarMenuButton
            asChild
            className="hover:bg-accent hover:text-white"
          >
            <a
              href={`http://localhost:3000/chat/${chat.chatId}`}
              className="text-sm"
            >
              <span>{chat.fileName}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs">{chat.fileName}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export default ChatInstance;
