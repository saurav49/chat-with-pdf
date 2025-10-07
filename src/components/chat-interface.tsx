"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import "highlight.js/styles/github.css";

import { ChatSessionProps } from "@/app/chat/[chatId]/page";
import { CheckCheck, CopyIcon } from "lucide-react";
import TooltipWrapper from "./tooltip-wrapper";
import { Button } from "./ui/button";

function getTextFromChildren(children: any): string {
  if (children == null) return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children))
    return children.map(getTextFromChildren).join("");
  if (typeof children === "object")
    return getTextFromChildren(children.props?.children ?? "");
  return String(children);
}

function formatParsedLLM(parsed: any): string {
  if (!parsed) return "";

  if (typeof parsed === "string") return parsed;
  if (typeof parsed.response === "string") return parsed.response;
  if (typeof parsed.answer === "string") return parsed.answer;

  if (Array.isArray(parsed.steps)) {
    const mdSteps = parsed.steps
      .map((s: any, i: number) => {
        const title = s.step ?? `Step ${i + 1}`;
        const desc = s.description ? `${s.description}\n\n` : "";
        const code = s.code ? `\`\`\`javascript\n${s.code}\n\`\`\`\n\n` : "";
        return `### ${i + 1}. ${title}\n\n${desc}${code}`;
      })
      .join("\n");
    const note = parsed.note ? `---\n\n${parsed.note}\n` : "";
    return `${mdSteps}\n${note}`.trim();
  }

  try {
    return "```\n" + JSON.stringify(parsed, null, 2) + "\n```";
  } catch {
    return String(parsed);
  }
}

function preprocessContent(raw: unknown): string {
  if (raw == null) return "";

  if (typeof raw === "object") {
    return formatParsedLLM(raw);
  }

  let text = String(raw);

  const fencedMatch = text.match(/^```(?:\w*\n)?([\s\S]*?)```$/m);
  let inner = fencedMatch ? fencedMatch[1].trim() : text.trim();

  try {
    const parsed = JSON.parse(inner);
    return formatParsedLLM(parsed);
  } catch {
    try {
      const parsed2 = JSON.parse(text);
      return formatParsedLLM(parsed2);
    } catch {
      const unescaped = inner.replace(/\\n/g, "\n").replace(/\\"/g, '"');
      return unescaped;
    }
  }
}

type CodeBlockProps = {
  inline?: boolean;
  className?: string | undefined;
  children?: any;
};

const CodeBlock: React.FC<CodeBlockProps> = ({
  inline,
  className,
  children,
  ...props
}) => {
  const raw = getTextFromChildren(children);
  const initial = String(raw).replace(/\n$/, "");
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";

  const [codeValue, _] = useState(initial);
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      console.error("copy failed", e);
    }
  };

  if (!inline) {
    return (
      <div className="my-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 shadow-sm overflow-hidden">
          {/* top bar */}
          <div className="flex items-center justify-between px-3 py-1 bg-slate-800/60 border-b border-slate-700">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-700 text-[11px]">
                {lang || "code"}
              </span>
              <span className="text-[11px] text-slate-400">Code</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCopy}
                className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
                aria-label="Copy code"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* code area */}
          <div className="p-3 bg-accent">
            <pre className="rounded-md overflow-auto text-sm font-mono whitespace-pre-wrap">
              <code className={className} {...props}>
                {codeValue}
              </code>
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <code
      className="rounded px-1 py-[0.08rem] bg-slate-700 text-sm font-mono"
      {...props}
    >
      {initial}
    </code>
  );
};

export function ChatInterface({
  chatSession,
}: {
  chatSession: ChatSessionProps | null;
}) {
  const [selectedChat, setSelectedChat] = useState<string | undefined>(
    undefined
  );
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  if (!chatSession) return null;

  const onCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      console.error("copy failed", e);
    }
  };
  const lastKnownChatContent = useMemo(
    () =>
      Array.isArray(chatSession?.messages) && chatSession?.messages.length > 0
        ? chatSession.messages[chatSession.messages.length - 1]?.content
        : null,
    [chatSession]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      console.log(`here`);
      if (bottomRef?.current) {
        bottomRef?.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      } else {
        document.body.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 0);

    return () => {
      clearTimeout(t);
    };
  }, [lastKnownChatContent]);

  return (
    <div
      className="flex flex-col w-full gap-y-3 px-4 max-w-3xl pb-40"
      ref={bottomRef}
    >
      {Array.isArray(chatSession.messages) && chatSession.messages.length > 0
        ? chatSession.messages.map((d) => {
            const contentToRender = preprocessContent(d.content);

            return (
              <div
                key={d.id}
                className="my-2 py-3 relative"
                onMouseOver={() => setSelectedChat(d.id)}
                onMouseOut={() => setSelectedChat(undefined)}
              >
                <>
                  {d.role === "user" ? (
                    <div className="[&_div]:rounded-md [&_div]:bg-accent [&_div]:w-fit [&_div]:px-4 [&_div]:py-3 flex  items-end my-2  flex-col">
                      <div>
                        <span className="text-sm text-white">{d.content}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md text-white flex items-start justify-start px-4 py-3 my-2">
                      <div className="prose prose-invert max-w-full ">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight, rehypeSanitize]}
                          components={{
                            // use the editor-like CodeBlock for code nodes
                            code: CodeBlock,
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              />
                            ),
                          }}
                        >
                          {contentToRender}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </>
                {selectedChat === d.id && d.role === "user" && (
                  <div className="flex items-center justify-end absolute top-17 right-0">
                    <div className="flex items-center gap-x-2">
                      <TooltipWrapper
                        trigger={
                          <Button
                            variant={"ghost"}
                            onClick={() => onCopy(d.content)}
                            className="hover:bg-none"
                          >
                            {copied ? (
                              <CheckCheck size="15" />
                            ) : (
                              <CopyIcon size="15" />
                            )}
                          </Button>
                        }
                        content={
                          <span className="text-xs">
                            {copied ? "Copied" : "Copy message"}
                          </span>
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        : null}
    </div>
  );
}
