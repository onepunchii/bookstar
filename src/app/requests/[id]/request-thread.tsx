"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthUi } from "@/lib/auth-ui-store";
import type { ThreadMessage } from "@/lib/types";
import { SafetyMenu } from "@/components/safety-menu";
import { SendHorizonal } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function RequestThread({
  requestId,
  initialMessages,
  counterpartUserId,
}: {
  requestId: string;
  initialMessages: ThreadMessage[];
  /** 협의 상대 유저 id — 신고·차단 메뉴용 */
  counterpartUserId?: string | null;
}) {
  const t = useT();
  const [thread, setThread] = useState<ThreadMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const openLogin = useAuthUi((s) => s.openLogin);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, body }),
      });
      if (res.status === 401) {
        openLogin(t("requests.thread.loginToSend"));
        return;
      }
      if (res.status === 403) {
        // 차단 관계 등 — 서버가 준 사유를 그대로 안내
        const d = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        alert(d?.error ?? t("requests.thread.cannotSend"));
        return;
      }
      if (!res.ok) throw new Error();
      // 발신자·표시명은 서버가 세션에서 도출해 반환한다
      const d = (await res.json()) as {
        id: string;
        createdAt: string;
        sender: "company" | "agency";
        senderName: string;
      };
      setThread((prev) => [
        ...prev,
        {
          id: d.id,
          requestId,
          sender: d.sender,
          senderName: d.senderName,
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
      <div className="flex items-center justify-between border-b border-white/8 py-2 pl-5 pr-2.5">
        <span className="text-sm font-semibold text-white/80">{t("requests.thread.title")}</span>
        <SafetyMenu
          targetType="chat"
          targetId={requestId}
          targetUserId={counterpartUserId}
          onBlocked={() => {
            alert(t("requests.thread.blocked"));
            window.location.href = "/requests";
          }}
          dark
        />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {thread.length === 0 && (
          <p className="py-16 text-center text-sm text-white/40">
            {t("requests.thread.empty")}
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
          placeholder={t("requests.thread.inputPlaceholder")}
          className="flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label={t("requests.thread.send")}
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
