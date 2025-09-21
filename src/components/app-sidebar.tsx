import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { CreateNewChatModal } from "./create-new-chat-modal";
import ChatInstance from "./chat-instance";

export interface ChatType {
  id: number;
  name: string;
  updatedAt: Date;
}

interface AppSidebarProps {
  data: ChatType[];
}

export async function AppSidebar({ data }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="flex gap-y-3">
          <SidebarGroupLabel className="text-md w-full flex items-center justify-center">
            PDF.chat
          </SidebarGroupLabel>
          <CreateNewChatModal />
          <SidebarGroupContent>
            <SidebarMenu>
              {data.map((chat) => (
                <ChatInstance chat={chat} key={chat.id} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
