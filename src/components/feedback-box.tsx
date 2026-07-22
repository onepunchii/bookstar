"use client";

// 건의함 — 제휴·버그·개선 접수. 광고주 홈(다크)·소속사 대시보드(라이트) 하단 공용.
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Check, Loader2, MessageSquarePlus, Send } from "lucide-react";

const CATEGORIES = ["제휴", "버그", "개선", "기타"] as const;

export function FeedbackBox({
  role,
  dark = false,
}: {
  role: "company" | "agency";
  dark?: boolean;
}) {
  const t = useT();
  const [category, setCategory] = useState<string>("제휴");
  const [body, setBody] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryLabel = (c: string) =>
    c === "제휴"
      ? t("feedback.categoryPartnership")
      : c === "버그"
        ? t("feedback.categoryBug")
        : c === "개선"
          ? t("feedback.categoryImprove")
          : t("feedback.categoryEtc");

  const submit = async () => {
    if (body.trim().length < 5) {
      setError(t("feedback.errorTooShort"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          category,
          body,
          contact: contact || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("feedback.errorSubmit"));
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("feedback.errorSubmit"));
      setSending(false);
    }
  };

  const boxCls = dark
    ? "glass rounded-[1.75rem] p-6 sm:p-8"
    : "rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8";
  const titleCls = cn(
    "flex items-center gap-2 text-lg font-black",
    dark ? "text-white" : "text-neutral-900"
  );
  const subCls = cn("mt-1 text-sm", dark ? "text-white/45" : "text-neutral-500");
  const fieldCls = dark
    ? "w-full rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-white ring-1 ring-white/12 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500"
    : "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500";

  if (sent) {
    return (
      <div className={cn(boxCls, "text-center")}>
        <Check
          className={cn(
            "mx-auto h-8 w-8",
            dark ? "text-brand-400" : "text-brand-500"
          )}
        />
        <p className={cn("mt-3 font-bold", dark ? "text-white" : "text-neutral-900")}>
          {t("feedback.sentTitle")}
        </p>
        <p className={subCls}>{t("feedback.sentDesc")}</p>
      </div>
    );
  }

  return (
    <div className={boxCls}>
      <p className={titleCls}>
        <MessageSquarePlus
          className={cn("h-5 w-5", dark ? "text-brand-400" : "text-brand-500")}
        />
        {t("feedback.title")}
      </p>
      <p className={subCls}>{t("feedback.subtitle")}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              category === c
                ? "bg-brand-500 text-white"
                : dark
                  ? "bg-white/5 text-white/55 ring-1 ring-white/10 hover:text-white"
                  : "bg-neutral-100 text-neutral-500 hover:text-neutral-900"
            )}
          >
            {categoryLabel(c)}
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={
          category === "제휴"
            ? t("feedback.bodyPlaceholderPartnership")
            : category === "버그"
              ? t("feedback.bodyPlaceholderBug")
              : t("feedback.bodyPlaceholderDefault")
        }
        className={cn(fieldCls, "mt-3 resize-none")}
      />
      <input
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder={t("feedback.contactPlaceholder")}
        className={cn(fieldCls, "mt-2")}
      />

      {error && (
        <p className="mt-2 text-sm font-medium text-red-400">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={sending}
        className="mt-4 flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {t("feedback.submit")}
      </button>
    </div>
  );
}
