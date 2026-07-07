"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function SearchBar({
  defaultValue,
  dark = false,
}: {
  defaultValue?: string;
  dark?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <form
      className="relative max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q") as string;
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set("q", q);
        else params.delete("q");
        router.push(`/artists?${params.toString()}`);
      }}
    >
      <Search
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2",
          dark ? "text-white/40" : "text-neutral-400"
        )}
      />
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder="아티스트, 소속사, 키워드 검색 (예: 축제, 뷰티, MC)"
        className={cn(
          "h-13 w-full rounded-2xl pl-11 pr-4 text-sm outline-none",
          dark
            ? "adv-glass py-3.5 text-white placeholder:text-white/35 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/25"
            : "border border-neutral-300 bg-white py-3 placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        )}
      />
    </form>
  );
}
