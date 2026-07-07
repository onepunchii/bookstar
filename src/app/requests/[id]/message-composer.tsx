"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBookingsStore } from "@/lib/bookings-store";
import { Send } from "lucide-react";

export function MessageComposer({ requestId }: { requestId: string }) {
  const [value, setValue] = useState("");
  const appendMessage = useBookingsStore((s) => s.appendMessage);

  return (
    <form
      className="flex gap-2 border-t border-neutral-100 p-3"
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
        className="h-10 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none"
      />
      <Button type="submit" disabled={!value.trim()} aria-label="보내기">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
