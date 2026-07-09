"use client";

// 소속사 인증 셋업 — 소속사명·담당자·유형 + 사업자등록증 첨부(라이트).
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, Check, FileText, Loader2, Upload, UserRound, X } from "lucide-react";

const TYPES = [
  { value: "solo", icon: UserRound, title: "1인 기획사 · 유튜버", desc: "무료" },
  { value: "company", icon: Building2, title: "기업 · MCN", desc: "SaaS" },
] as const;

const field =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function VerifyForm({
  initial,
}: {
  initial: { companyName: string; manager: string; phone: string; agencyType: string };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [agencyType, setAgencyType] = useState(initial.agencyType || "solo");
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [manager, setManager] = useState(initial.manager);
  const [phone, setPhone] = useState(initial.phone);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickDoc = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const res = await fetch("/api/join/agency/doc", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      setDocUrl(data.url);
      setDocName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "서류 업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!companyName.trim()) return setError("소속사명을 입력해주세요");
    if (!docUrl) return setError("사업자등록증 등 인증 서류를 첨부해주세요");
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/join/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          manager: manager || undefined,
          phone: phone || undefined,
          agencyType,
          businessDocUrl: docUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "제출 실패");
      router.push("/agency");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "제출에 실패했어요");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 유형 */}
      <div>
        <p className="mb-2 text-sm font-semibold text-neutral-700">소속사 유형</p>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => {
            const active = agencyType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setAgencyType(t.value)}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition-colors",
                  active ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:border-neutral-400"
                )}
              >
                <t.icon className={cn("h-5 w-5", active ? "text-brand-500" : "text-neutral-400")} />
                <p className="mt-2 text-sm font-bold text-neutral-900">{t.title}</p>
                <p className="text-xs text-neutral-500">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-neutral-700">소속사명 *</span>
        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="예) 스타원엔터테인먼트" className={field} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-neutral-700">담당자</span>
          <input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="예) 박세진 실장" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-neutral-700">연락처</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className={field} />
        </label>
      </div>

      {/* 서류 */}
      <div>
        <p className="mb-1.5 text-sm font-semibold text-neutral-700">
          인증 서류 * <span className="font-normal text-neutral-400">사업자등록증 · 아티스트 권리 증빙 (PDF·이미지)</span>
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pickDoc(f);
            e.target.value = "";
          }}
        />
        {docUrl ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <FileText className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-800">{docName}</span>
            <button type="button" onClick={() => { setDocUrl(null); setDocName(null); }} aria-label="삭제" className="text-emerald-600 hover:text-emerald-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-sm font-semibold text-neutral-500 transition-colors hover:border-brand-400 hover:text-neutral-900 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "업로드 중…" : "서류 첨부하기"}
          </button>
        )}
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <button
        onClick={submit}
        disabled={saving || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        인증 신청하기
      </button>
      <p className="text-center text-xs text-neutral-400">
        제출 후 운영팀 검토를 거쳐 승인되면 소속사 센터가 열립니다. 검토 중에도 콘솔은 미리 둘러볼 수 있어요.
      </p>
    </div>
  );
}
