"use client";
import React from "react";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { ChatType } from "./app-sidebar";
import { usePathname } from "next/navigation";
import TooltipWrapper from "./tooltip-wrapper";

function ChatInstance({ chat }: { chat: ChatType }) {
  const pathname = usePathname();
  const chatId = pathname.split("/chat/")[1];
  return (
    <TooltipWrapper
      trigger={
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
              href={`http://localhost:3000/chat/${chat.id}`}
              className="text-sm"
            >
              <span>{chat.name}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      }
      content={<span className="text-xs">{chat.name}</span>}
    />
  );
}

export default ChatInstance;
