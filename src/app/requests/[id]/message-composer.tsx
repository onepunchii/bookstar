"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function MessageComposer() {
  const [value, setValue] = useState("");

  return (
    <form
      className="flex gap-2 border-t border-neutral-100 p-3"
      onSubmit={(e) => {
        e.preventDefault();
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
