"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function NewArtistButton() {
  const t = useT();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/artists/create", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        slug?: string;
        error?: string;
        upgrade?: boolean;
      };
      if (res.status === 403 && data.upgrade) {
        if (confirm(`${data.error}\n\n${t("agency.artists.goToPlanConfirm")}`))
          router.push("/agency/account");
        setCreating(false);
        return;
      }
      if (!res.ok || !data.slug) throw new Error();
      router.push(`/agency/artists/${data.slug}`);
    } catch {
      alert(t("agency.artists.createFailed"));
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
        {creating ? t("agency.artists.creating") : t("agency.artists.newArtist")}
      </span>
    </button>
  );
}
