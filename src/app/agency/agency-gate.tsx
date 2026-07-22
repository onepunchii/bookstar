// 소속사 인증 게이트 — 미인증(none/pending/rejected)일 때 콘솔 대신 전면 노출.
import Link from "next/link";
import type { SessionAgency } from "@/lib/data/session";
import { Clock, ShieldCheck } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { VerifyForm } from "./verify/verify-form";

export async function AgencyGate({ agency }: { agency: SessionAgency | null }) {
  const { t } = await getT();
  const FEATURES = t("agency.gate.features");
  // 심사 대기
  if (agency?.verificationStatus === "pending") {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Clock className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-neutral-900">
          {t("agency.gate.pendingTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          <span className="font-semibold text-neutral-700">
            {agency.companyName}
          </span>{" "}
          {t("agency.gate.pendingBodyBefore")}{" "}
          <br className="hidden sm:block" />
          <span className="font-semibold text-neutral-700">{FEATURES}</span>{" "}
          {t("agency.gate.pendingBodyAfter")}
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left text-xs text-neutral-500">
          {t("agency.gate.slaBefore")}{" "}
          <span className="font-bold text-neutral-700">
            {t("agency.gate.slaDays")}
          </span>{" "}
          {t("agency.gate.slaAfter")}
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-semibold text-neutral-400 hover:text-neutral-700"
        >
          {t("agency.gate.browseAdvertiserHome")}
        </Link>
      </div>
    );
  }

  // 미신청(none) 또는 반려(rejected) → 인증 폼
  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-neutral-900">
          {t("agency.gate.verifyTitle")}
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          {agency?.verificationStatus === "rejected"
            ? t("agency.gate.rejectedDesc")
            : t("agency.gate.noneDesc")}
        </p>
        <p className="mt-1.5 text-xs font-medium text-brand-600">
          {t("agency.gate.readyBody", { features: FEATURES })}
        </p>
      </div>
      <VerifyForm
        initial={{
          companyName: agency?.companyName ?? "",
          manager: agency?.manager ?? "",
          phone: agency?.phone ?? "",
          agencyType: agency?.agencyType ?? "solo",
        }}
      />
    </div>
  );
}
