"use client";

// 아티스트 삭제 — 되돌릴 수 없으므로 이름을 정확히 입력해야 실행된다.
// 섭외 요청 이력이 있으면 서버가 하드 삭제를 거부(409) → 비공개 전환을 제안한다.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { AlertTriangle, Trash2, X } from "lucide-react";

export function DeleteArtistButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 섭외 요청이 있어 하드 삭제가 거부된 경우의 건수
  const [blockedCount, setBlockedCount] = useState<number | null>(null);

  const close = () => {
    setOpen(false);
    setConfirmText("");
    setError(null);
    setBlockedCount(null);
  };

  const submit = async (archive: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/artists/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, archive }),
      });
      if (res.status === 409) {
        const j = await res.json();
        setBlockedCount(j.requestCount ?? 0);
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      close();
      router.refresh();
    } catch {
      setError(t("agency.artists.deleteError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 text-sm font-semibold text-neutral-400 transition-colors hover:border-red-300 hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" /> {t("agency.artists.delete")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </span>
                <p className="font-bold">
                  {blockedCount === null
                    ? t("agency.artists.deleteTitle")
                    : t("agency.artists.archiveTitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {blockedCount === null ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {t("agency.artists.deleteDesc", { name })}
                </p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={name}
                  className="mt-3 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900"
                />
                <button
                  type="button"
                  disabled={confirmText.trim() !== name || busy}
                  onClick={() => submit(false)}
                  className="mt-3 h-10 w-full rounded-lg bg-red-600 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy
                    ? t("agency.artists.deleting")
                    : t("agency.artists.deleteConfirm")}
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {t("agency.artists.archiveDesc", { n: blockedCount })}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => submit(true)}
                  className="mt-3 h-10 w-full rounded-lg bg-neutral-900 text-sm font-bold text-white disabled:opacity-40"
                >
                  {busy
                    ? t("agency.artists.deleting")
                    : t("agency.artists.archiveConfirm")}
                </button>
              </>
            )}

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            <button
              type="button"
              onClick={close}
              className="mt-2 h-9 w-full rounded-lg text-sm font-semibold text-neutral-500 hover:bg-neutral-50"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
