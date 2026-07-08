"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import type { SessionAgency } from "@/lib/data/session";
import { cn } from "@/lib/utils";
import { Building2, CheckCircle2, Crown, User } from "lucide-react";

const TYPES = [
  {
    key: "solo" as const,
    icon: User,
    title: "1인 기획사 · 유튜버",
    plan: "무료",
    desc: "혼자 활동하는 크리에이터·1인 기획. 모든 기능 무료로 시작.",
  },
  {
    key: "company" as const,
    icon: Building2,
    title: "대형 기획사 · MCN",
    plan: "SaaS 유료",
    desc: "소속 아티스트 다수 관리. 팀 협업·정산·리포트 등 엔터프라이즈.",
  },
];

export function AccountForm({ agency }: { agency: SessionAgency }) {
  const [type, setType] = useState<"solo" | "company">(
    agency.agencyType === "company" ? "company" : "solo"
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/agency/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: String(fd.get("companyName") ?? "").trim(),
          agencyType: type,
          manager: String(fd.get("manager") ?? "").trim() || null,
          phone: String(fd.get("phone") ?? "").trim() || null,
          email: String(fd.get("email") ?? "").trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setError("저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> 저장되었습니다.
        </div>
      )}

      {/* 유형 선택 → 요금제 */}
      <div>
        <Label>소속사 유형 · 요금제</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={cn(
                "rounded-2xl border-2 p-4 text-left transition-colors",
                type === t.key
                  ? "border-brand-500 bg-brand-50/50"
                  : "border-neutral-200 hover:border-neutral-400"
              )}
            >
              <div className="flex items-center justify-between">
                <t.icon
                  className={cn(
                    "h-5 w-5",
                    type === t.key ? "text-brand-600" : "text-neutral-400"
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                    t.key === "company"
                      ? "bg-neutral-900 text-white"
                      : "bg-brand-500 text-white"
                  )}
                >
                  {t.key === "company" && <Crown className="h-3 w-3" />}
                  {t.plan}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold">{t.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                {t.desc}
              </p>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          1인 기획사·유튜버는 무료, 대형 기획사는 SaaS 구독으로 운영돼요. 유형은
          언제든 바꿀 수 있어요.
        </p>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="font-bold">기본 정보</h2>
        <div>
          <Label htmlFor="companyName">소속사명</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={agency.companyName}
            placeholder="예: 스타원엔터테인먼트"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="manager">담당자</Label>
            <Input
              id="manager"
              name="manager"
              defaultValue={agency.manager ?? ""}
              placeholder="예: 박세진"
            />
          </div>
          <div>
            <Label htmlFor="phone">연락처</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={agency.phone ?? ""}
              placeholder="예: 010-1234-5678"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={agency.email ?? ""}
            placeholder="예: manager@company.co.kr"
          />
        </div>
      </Card>

      {error && (
        <p className="text-sm font-semibold text-red-600">{error}</p>
      )}
      <Button size="lg" type="submit" disabled={saving}>
        {saving ? "저장 중…" : "프로필 저장"}
      </Button>
    </form>
  );
}
