"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "./file-upload";
import { Upload } from "lucide-react";
import { useState } from "react";

export function CreateNewChatModal() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="cursor-pointer inline-flex py-2 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-sm text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
          New Chat
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-x-2">
            <Upload className="h-5 w-5" />
            Upload PDF Documents
          </DialogTitle>
          <DialogDescription>
            Upload one or multiple PDF files to start chatting with your
            documents
          </DialogDescription>
        </DialogHeader>
        <FileUpload setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}
