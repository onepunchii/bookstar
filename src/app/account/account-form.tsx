"use client";

// 광고주 프로필 편집 폼 — 개인/기업 구분·이름·회사명·연락처.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionProfile } from "@/lib/data/session";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Building2, Check, Loader2, User } from "lucide-react";

const TYPES = [
  { value: "personal", icon: User, title: "account.form.personal", desc: "account.form.personalDesc" },
  { value: "business", icon: Building2, title: "account.form.business", desc: "account.form.businessDesc" },
] as const;

const inputCls =
  "w-full rounded-xl bg-white/[0.05] px-4 py-3 text-sm font-medium text-white ring-1 ring-white/12 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function MeAccountForm({ profile }: { profile: SessionProfile }) {
  const router = useRouter();
  const t = useT();
  const [accountType, setAccountType] = useState(profile.accountType);
  const [name, setName] = useState(profile.name);
  const [company, setCompany] = useState(profile.company ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) {
      setError(t("account.form.nameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company: accountType === "business" ? company : null,
          accountType,
          phone,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      setError(t("account.form.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adv-card space-y-7 rounded-[1.75rem] p-7 sm:p-8">
      {/* 구분 */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">
          {t("account.form.typeHeading")}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPES.map((opt) => {
            const active = accountType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAccountType(opt.value)}
                className={cn(
                  "rounded-2xl p-4 text-left ring-1 transition-colors",
                  active
                    ? "bg-brand-500/12 ring-brand-500"
                    : "bg-white/[0.03] ring-white/10 hover:ring-white/25"
                )}
              >
                <opt.icon
                  className={cn(
                    "h-4.5 w-4.5",
                    active ? "text-brand-400" : "text-white/40"
                  )}
                />
                <p className="mt-2 text-sm font-bold text-white">{t(opt.title)}</p>
                <p className="mt-0.5 text-xs text-white/45">{t(opt.desc)}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 필드 */}
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/55">
            {t("account.form.name")}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("account.form.namePlaceholder")}
            className={inputCls}
          />
        </label>
        {accountType === "business" && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-white/55">
              {t("account.form.company")}
            </span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t("account.form.companyPlaceholder")}
              className={inputCls}
            />
            <span className="mt-1.5 block text-[11px] text-white/35">
              {t("account.form.companyHint")}
            </span>
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/55">
            {t("account.form.phone")}{" "}
            <span className="font-normal text-white/30">
              {t("common.optional")}
            </span>
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("account.form.phonePlaceholder")}
            className={inputCls}
          />
        </label>
        {profile.email && (
          <p className="text-xs text-white/35">
            {t("account.form.email", { email: profile.email })}
          </p>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-400">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : null}
        {saved ? t("account.form.saved") : t("account.form.save")}
      </button>
    </div>
  );
}
