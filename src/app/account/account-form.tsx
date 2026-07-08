"use client";

// 광고주 프로필 편집 폼 — 개인/기업 구분·이름·회사명·연락처.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionProfile } from "@/lib/data/session";
import { cn } from "@/lib/utils";
import { Building2, Check, Loader2, User } from "lucide-react";

const TYPES = [
  {
    value: "personal",
    icon: User,
    title: "개인",
    desc: "개인 자격으로 섭외 요청 — 무료",
  },
  {
    value: "business",
    icon: Building2,
    title: "기업 · 브랜드",
    desc: "회사·브랜드 이름으로 섭외 요청 — 무료",
  },
] as const;

const inputCls =
  "w-full rounded-xl bg-white/[0.05] px-4 py-3 text-sm font-medium text-white ring-1 ring-white/12 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function MeAccountForm({ profile }: { profile: SessionProfile }) {
  const router = useRouter();
  const [accountType, setAccountType] = useState(profile.accountType);
  const [name, setName] = useState(profile.name);
  const [company, setCompany] = useState(profile.company ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) {
      setError("이름을 입력해 주세요");
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
      setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adv-card space-y-7 rounded-[1.75rem] p-7 sm:p-8">
      {/* 구분 */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">
          계정 구분
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPES.map((t) => {
            const active = accountType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setAccountType(t.value)}
                className={cn(
                  "rounded-2xl p-4 text-left ring-1 transition-colors",
                  active
                    ? "bg-brand-500/12 ring-brand-500"
                    : "bg-white/[0.03] ring-white/10 hover:ring-white/25"
                )}
              >
                <t.icon
                  className={cn(
                    "h-4.5 w-4.5",
                    active ? "text-brand-400" : "text-white/40"
                  )}
                />
                <p className="mt-2 text-sm font-bold text-white">{t.title}</p>
                <p className="mt-0.5 text-xs text-white/45">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 필드 */}
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/55">
            담당자 이름
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className={inputCls}
          />
        </label>
        {accountType === "business" && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-white/55">
              회사 · 브랜드명
            </span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="브라이트마케팅"
              className={inputCls}
            />
            <span className="mt-1.5 block text-[11px] text-white/35">
              섭외 요청 시 소속사에 이 이름으로 표시돼요
            </span>
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-white/55">
            연락처 <span className="font-normal text-white/30">(선택)</span>
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            className={inputCls}
          />
        </label>
        {profile.email && (
          <p className="text-xs text-white/35">
            로그인 이메일 · {profile.email}
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
        {saved ? "저장됐어요" : "프로필 저장"}
      </button>
    </div>
  );
}
