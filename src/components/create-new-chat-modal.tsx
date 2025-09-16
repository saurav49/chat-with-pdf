import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "./file-upload";
import { NewChatButton } from "./new-chat-button";
import { Upload } from "lucide-react";

export function CreateNewChatModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <NewChatButton />
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
        <FileUpload />
      </DialogContent>
    </Dialog>
  );
}
