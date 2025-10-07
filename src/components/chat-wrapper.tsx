// components/chat-wrapper.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import ChatFormWrapper from "./chat-form-wrapper";
import { ChatInterface } from "./chat-interface";
import { ChatSessionProps, MessageProps } from "@/app/chat/[chatId]/page";
import axios from "axios";

export function ChatWrapper({
  chatId,
  data,
}: {
  chatId: string;
  data: ChatSessionProps;
}) {
  const [chatSession, setChatSession] = useState<ChatSessionProps | null>(data);
  const [isloading, setIsloading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const pendingTokensRef = useRef<Record<string, string>>({});
  const flushTimerRef = useRef<number | null>(null);
  const FLUSH_INTERVAL = 60;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, []);

  async function refetchChatSession() {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/chat/${chatId}`
      );
      if (res?.status === 200 && res?.data) {
        setChatSession(res.data);
      }
    } catch (err) {
      console.log("Refetch chat failed", err);
    }
  }

  function scheduleFlush() {
    if (flushTimerRef.current != null) return;
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      setChatSession((prev) => {
        if (!prev) return prev;
        const updatedMessages = prev.messages.map((m) => {
          const pending = pendingTokensRef.current[m.id as string];
          if (pending) {
            const newContent = (m.content ?? "") + pending;
            return { ...m, content: newContent };
          }
          return m;
        });
        for (const id of Object.keys(pendingTokensRef.current)) {
          delete pendingTokensRef.current[id];
        }
        return { ...prev, messages: updatedMessages };
      });
    }, FLUSH_INTERVAL);
  }

  async function streamAssistant(
    payload: {
      chatId: string;
      content: string;
      role: "user" | "system" | "assistant";
      collectionName: string;
    },
    onToken: (token: string) => void
  ) {
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/message/add`, {
      method: "POST",
      body: JSON.stringify(payload),
      signal: ac.signal,
    });

    if (!res.body) throw new Error("No response body from stream endpoint");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const lineRaw of lines) {
          const line = lineRaw.trim();
          if (!line) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "token" && parsed.text) {
              onToken(parsed.text);
            } else if (parsed.type === "error") {
              console.error("stream error", parsed);
            } else if (parsed.type === "done") {
              return;
            } else {
              if (parsed.text) onToken(parsed.text);
            }
          } catch {
            // not JSON: pass raw line text
            onToken(line);
          }
        }

        if (buf.trim()) {
          try {
            const parsed = JSON.parse(buf);
            if (parsed.type === "done") return;
            if (parsed.type === "token" && parsed.text) onToken(parsed.text);
          } catch {
            onToken(buf);
          }
        }
      }
    } finally {
      try {
        reader.cancel();
      } catch {}
      abortControllerRef.current = null;
    }
  }

  // onSend: create a temp assistant message and stream into it
  async function onSend(message: MessageProps & { collectionName: string }) {
    if (!chatSession) return;
    setIsloading(true);

    const assistantTempId = `tmp-${Date.now()}`;

    setChatSession((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              {
                ...message,
              },
              {
                id: assistantTempId,
                chatId: message.chatId,
                role: "assistant",
                content: "",
              },
            ],
          }
        : prev
    );

    try {
      await streamAssistant(message, (token) => {
        pendingTokensRef.current[assistantTempId] =
          (pendingTokensRef.current[assistantTempId] || "") + token;
        scheduleFlush();
      });

      if (pendingTokensRef.current[assistantTempId]) {
        const pending = pendingTokensRef.current[assistantTempId];
        pendingTokensRef.current[assistantTempId] = "";
        setChatSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === assistantTempId
                ? { ...m, content: (m.content ?? "") + pending }
                : m
            ),
          };
        });
      }

      // replace temp message with DB-backed final message, or just refresh entire session
      await refetchChatSession();
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        console.log("Stream aborted");
      } else {
        console.log("streaming failed", err);
        // remove the temp assistant message on failure
        setChatSession((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.filter((m) => m.id !== assistantTempId),
              }
            : prev
        );
      }
    } finally {
      setIsloading(false);
      // cleanup any leftovers
      delete pendingTokensRef.current[assistantTempId];
    }
  }

  return (
    <div className="flex flex-col items-center">
      <ChatInterface chatSession={chatSession} />
      <ChatFormWrapper
        chatId={chatId}
        chatSession={chatSession}
        onSend={onSend}
        isloading={isloading}
      />
    </div>
  );
}
