"use client";

// 소속사 인증 셋업 — 소속사명·담당자·유형 + 사업자등록증 첨부(라이트).
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Building2, Check, FileText, Loader2, Upload, UserRound, X } from "lucide-react";

const TYPES = [
  { value: "solo", icon: UserRound },
  { value: "company", icon: Building2 },
] as const;

const field =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500";

export function VerifyForm({
  initial,
}: {
  initial: { companyName: string; manager: string; phone: string; agencyType: string };
}) {
  const t = useT();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [agencyType, setAgencyType] = useState(initial.agencyType || "solo");
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [manager, setManager] = useState(initial.manager);
  const [phone, setPhone] = useState(initial.phone);
  const [bizNumber, setBizNumber] = useState("");
  const [bizType, setBizType] = useState<string | null>(null); // 업태·종목(OCR) — 심사용, 폼 노출 없음
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [ocrFilled, setOcrFilled] = useState(false);
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
      if (!res.ok) throw new Error(data.error ?? t("agency.verify.uploadFailed"));
      setDocUrl(data.url);
      setDocName(file.name);
      // OCR 자동 입력 — 서류에서 인식된 값으로 빈 칸 채움
      const ocr = data.ocr as {
        companyName?: string | null;
        repName?: string | null;
        bizNumber?: string | null;
        bizType?: string | null;
      } | null;
      if (ocr && (ocr.companyName || ocr.repName || ocr.bizNumber)) {
        if (ocr.companyName) setCompanyName((v) => v.trim() || ocr.companyName!);
        if (ocr.repName) setManager((v) => v.trim() || ocr.repName!);
        if (ocr.bizNumber) setBizNumber((v) => v.trim() || ocr.bizNumber!);
        setOcrFilled(true);
      }
      if (ocr?.bizType) setBizType(ocr.bizType);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("agency.verify.docUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!companyName.trim()) return setError(t("agency.verify.errNameRequired"));
    // 기업·MCN(company)만 사업자등록증 필수. 1인·인플루언서(solo)는 서류 없이 즉시 인증.
    if (agencyType === "company" && !docUrl)
      return setError(t("agency.verify.errDocRequired"));
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
          businessNumber: bizNumber || undefined,
          businessType: bizType || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("agency.verify.submitFailed"));
      router.push("/agency");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("agency.verify.submitFailed2"));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 유형 */}
      <div>
        <p className="mb-2 text-sm font-semibold text-neutral-700">{t("agency.verify.typeLabel")}</p>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((opt) => {
            const active = agencyType === opt.value;
            const title =
              opt.value === "solo"
                ? t("agency.verify.typeSoloTitle")
                : t("agency.verify.typeCompanyTitle");
            const desc = opt.value === "solo" ? t("common.free") : "SaaS";
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAgencyType(opt.value)}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition-colors",
                  active ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:border-neutral-400"
                )}
              >
                <opt.icon className={cn("h-5 w-5", active ? "text-brand-500" : "text-neutral-400")} />
                <p className="mt-2 text-sm font-bold text-neutral-900">{title}</p>
                <p className="text-xs text-neutral-500">{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-neutral-700">{t("agency.verify.nameLabel")}</span>
        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t("agency.verify.namePlaceholder")} className={field} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-neutral-700">{t("agency.verify.managerLabel")}</span>
          <input value={manager} onChange={(e) => setManager(e.target.value)} placeholder={t("agency.verify.managerPlaceholder")} className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-neutral-700">{t("agency.verify.phoneLabel")}</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className={field} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-neutral-700">
          {t("agency.verify.bizNumberLabel")}{" "}
          <span className="font-normal text-neutral-400">
            {t("agency.verify.bizNumberHint")}
          </span>
        </span>
        <input
          value={bizNumber}
          onChange={(e) => setBizNumber(e.target.value)}
          placeholder="000-00-00000"
          className={field}
        />
      </label>

      {/* 서류 — 기업·MCN만 필수, 1인·인플루언서는 선택 */}
      <div>
        <p className="mb-1.5 text-sm font-semibold text-neutral-700">
          {t("agency.verify.docLabel")}{" "}
          {agencyType === "company" ? (
            <>
              <span className="text-brand-500">*</span>{" "}
              <span className="font-normal text-neutral-400">
                {t("agency.verify.docHint")}
              </span>
            </>
          ) : (
            <span className="font-bold text-brand-600">
              {t("agency.verify.docOptional")}
            </span>
          )}
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
          <div>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <FileText className="h-5 w-5 shrink-0 text-emerald-600" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-800">{docName}</span>
              <button type="button" onClick={() => { setDocUrl(null); setDocName(null); setOcrFilled(false); }} aria-label={t("agency.verify.delete")} className="text-emerald-600 hover:text-emerald-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            {ocrFilled && (
              <p className="mt-1.5 text-xs font-medium text-brand-600">
                {t("agency.verify.ocrFilled")}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-sm font-semibold text-neutral-500 transition-colors hover:border-brand-400 hover:text-neutral-900 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? t("agency.verify.uploading") : t("agency.verify.attachDoc")}
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
        {t("agency.verify.submitCta")}
      </button>
      <p className="text-center text-xs text-neutral-400">
        {t("agency.verify.footnote")}
      </p>
    </div>
  );
}
