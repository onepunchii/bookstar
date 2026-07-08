"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ThreadMessage } from "@/lib/types";
import { SendHorizonal } from "lucide-react";

export function RequestThread({
  requestId,
  initialMessages,
}: {
  requestId: string;
  initialMessages: ThreadMessage[];
}) {
  const [thread, setThread] = useState<ThreadMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          sender: "company",
          senderName: "광고주",
          body,
        }),
      });
      if (!res.ok) throw new Error();
      const d = (await res.json()) as { id: string; createdAt: string };
      setThread((t) => [
        ...t,
        {
          id: d.id,
          requestId,
          sender: "company",
          senderName: "광고주",
          body,
          createdAt: d.createdAt,
        },
      ]);
      setText("");
    } catch {
      /* 무시 */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="adv-card flex h-[560px] flex-col overflow-hidden rounded-[1.75rem]">
      <div className="border-b border-white/8 px-5 py-3.5 text-sm font-semibold text-white/80">
        협의 채팅
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {thread.length === 0 && (
          <p className="py-16 text-center text-sm text-white/40">
            아직 메시지가 없어요. 소속사 응답을 기다리는 중입니다.
          </p>
        )}
        {thread.map((msg) =>
          msg.sender === "system" ? (
            <p key={msg.id} className="text-center text-xs text-white/35">
              {msg.body}
            </p>
          ) : (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col",
                msg.sender === "company" ? "items-end" : "items-start"
              )}
            >
              <span className="mb-1 px-1 text-xs text-white/40">
                {msg.senderName}
              </span>
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.sender === "company"
                    ? "rounded-br-md bg-brand-500 text-white"
                    : "rounded-bl-md bg-white/[0.08] text-white/90"
                )}
              >
                {msg.body}
              </div>
            </div>
          )
        )}
      </div>
      <div className="flex items-end gap-2 border-t border-white/8 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="메시지를 입력하세요"
          className="flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="전송"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
