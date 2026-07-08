"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export function NewArtistButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/artists/create", { method: "POST" });
      if (!res.ok) throw new Error();
      const { slug } = (await res.json()) as { slug: string };
      router.push(`/agency/artists/${slug}`);
    } catch {
      alert("등록에 실패했어요. 다시 시도해주세요.");
      setCreating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={create}
      disabled={creating}
      className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-60"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
        {creating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </span>
      <span className="text-sm font-semibold">
        {creating ? "등록 중…" : "새 아티스트 등록"}
      </span>
    </button>
  );
}
