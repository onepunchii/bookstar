"use client";

import { getCurrentManager, useScopeStore } from "@/lib/scope-store";
import { cn } from "@/lib/utils";
import { Filter, UserRound } from "lucide-react";

export function ScopeToggle({ className }: { className?: string }) {
  const { currentManagerId, myArtistsOnly, toggleMyOnly } = useScopeStore();
  const manager = getCurrentManager(currentManagerId);
  return (
    <button
      onClick={toggleMyOnly}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        myArtistsOnly
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-900",
        className
      )}
    >
      {myArtistsOnly ? (
        <UserRound className="h-3 w-3" />
      ) : (
        <Filter className="h-3 w-3" />
      )}
      {myArtistsOnly ? `내 담당 (${manager.name})만 보기` : "전체 보기"}
    </button>
  );
}
