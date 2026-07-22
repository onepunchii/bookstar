"use client";

// 소속사 지원 패널 — 아티스트 지정 + 어필 + (선택)제안 견적(라이트).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Check, Loader2, Send } from "lucide-react";

export function ApplyPanel({
  campaignId,
  artists,
  applied,
  closed,
}: {
  campaignId: string;
  artists: { id: string; name: string }[];
  applied: { status: string } | null;
  closed: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const APP_STATUS: Record<string, string> = {
    applied: t("agency.campaigns.statusApplied"),
    shortlisted: t("agency.campaigns.statusShortlisted"),
    selected: t("agency.campaigns.statusSelected"),
    rejected: t("agency.campaigns.statusRejected"),
    withdrawn: t("agency.campaigns.statusWithdrawn"),
  };
  const [open, setOpen] = useState(false);
  const [artistId, setArtistId] = useState(artists[0]?.id ?? "");
  const [pitch, setPitch] = useState("");
  const [fee, setFee] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (applied) {
    return (
      <div
        className={cn(
          "rounded-xl px-4 py-2.5 text-sm font-semibold",
          applied.status === "selected"
            ? "bg-emerald-50 text-emerald-700"
            : applied.status === "rejected"
              ? "bg-neutral-100 text-neutral-400"
              : "bg-brand-50 text-brand-700"
        )}
      >
        {APP_STATUS[applied.status] ?? t("agency.campaigns.statusApplied")}
      </div>
    );
  }

  if (closed) {
    return (
      <div className="rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-400">
        {t("agency.campaigns.closed")}
      </div>
    );
  }

  if (artists.length === 0) {
    return (
      <p className="text-xs text-neutral-400">
        {t("agency.campaigns.needArtist")}
      </p>
    );
  }

  const submit = async () => {
    if (!artistId) return setError(t("agency.campaigns.selectArtist"));
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId,
          pitch: pitch || undefined,
          proposedFee: fee ? Number(fee) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("agency.campaigns.applyFailed"));
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("agency.campaigns.applyFailedRetry"));
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        <Send className="h-3.5 w-3.5" /> {t("agency.campaigns.applyCta")}
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-500">
          {t("agency.campaigns.fieldArtist")}
        </label>
        <select
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-500">
          {t("agency.campaigns.fieldPitch")}{" "}
          <span className="font-normal text-neutral-400">
            {t("common.optional")}
          </span>
        </label>
        <textarea
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          rows={2}
          placeholder={t("agency.campaigns.pitchPlaceholder")}
          className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-neutral-500">
          {t("agency.campaigns.fieldFee")}{" "}
          <span className="font-normal text-neutral-400">
            {t("agency.campaigns.fieldFeeHint")}
          </span>
        </label>
        <input
          type="number"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder={t("agency.campaigns.feePlaceholder")}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {t("agency.campaigns.submitCta")}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
