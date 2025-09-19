import axios from "axios";
import { AppSidebar } from "./app-sidebar";

export async function AppSidebarWrapper() {
  const r = await axios.get(`${process.env.BASE_URL}/get-chats`);
  if (r?.status !== 200) {
    return;
  }
  return <AppSidebar data={r?.data} />;
}
