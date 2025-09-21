"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import "highlight.js/styles/github.css";

import { ChatSessionProps } from "@/app/chat/[chatId]/page";

export function ChatInterface({
  chatSession,
}: {
  chatSession: ChatSessionProps | null;
}) {
  if (!chatSession) return null;

  return (
    <div className="flex flex-col w-full gap-y-3 px-4 max-w-3xl pb-40">
      {Array.isArray(chatSession.messages) && chatSession.messages.length > 0
        ? chatSession.messages.map((d) => (
            <div key={d.id} className="my-2">
              {d.role === "user" ? (
                <div className="[&_div]:rounded-md [&_div]:bg-accent [&_div]:w-fit [&_div]:px-4 [&_div]:py-3 flex items-center justify-end my-2">
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
                        // @ts-expect-error
                        code({ node, inline, className, children, ...props }) {
                          const codeText = String(children).replace(/\n$/, "");
                          const match = /language-(\w+)/.exec(className || "");
                          const lang = match ? match[1] : "";

                          if (!inline) {
                            return (
                              <div className="relative group my-2">
                                <pre
                                  className={`rounded-md p-3 overflow-auto text-sm pt-10`}
                                  style={{ background: "transparent" }}
                                >
                                  <code className={className} {...props}>
                                    {codeText}
                                  </code>
                                </pre>

                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(
                                        codeText
                                      );
                                      // simple feedback: change button text or flash — keep minimal here
                                      // You can integrate a toast library to show "copied"
                                    } catch (e) {
                                      console.error("Copy failed", e);
                                    }
                                  }}
                                  className="absolute top-2 right-2 rounded px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600"
                                  aria-label="Copy code"
                                >
                                  Copy
                                </button>

                                {lang ? (
                                  <div className="absolute top-2 left-2 px-2 py-0.5 text-xs rounded bg-slate-700">
                                    {lang}
                                  </div>
                                ) : null}
                              </div>
                            );
                          }

                          return (
                            <code
                              className="rounded px-1 py-[0.08rem] bg-slate-700 text-sm"
                              {...props}
                            >
                              {codeText}
                            </code>
                          );
                        },
                        a: ({ node, ...props }) => (
                          // open links in new tab
                          // eslint-disable-next-line jsx-a11y/anchor-has-content
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          />
                        ),
                      }}
                    >
                      {d.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))
        : null}
    </div>
  );
}
