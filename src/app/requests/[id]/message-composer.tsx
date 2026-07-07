"use client";

import { useState } from "react";
import { useBookingsStore } from "@/lib/bookings-store";
import { Send } from "lucide-react";

export function MessageComposer({ requestId }: { requestId: string }) {
  const [value, setValue] = useState("");
  const appendMessage = useBookingsStore((s) => s.appendMessage);

  return (
    <form
      className="flex gap-2 border-t border-white/8 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const text = value.trim();
        if (!text) return;
        appendMessage(requestId, {
          sender: "company",
          senderName: "브라이트마케팅 이대리",
          body: text,
        });
        setValue("");
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="메시지를 입력하세요"
        className="h-10 flex-1 rounded-xl bg-white/[0.06] px-3.5 text-sm text-white placeholder:text-white/35 focus:bg-white/[0.09] focus:outline-none"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        aria-label="보내기"
        className="premium-ease flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
