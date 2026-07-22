import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAgency, getSessionUser } from "@/lib/data/session";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { VerifyForm } from "./verify-form";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AgencyVerifyPage() {
  const { t } = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/agency/verify");
  const agency = await getSessionAgency();
  if (agency?.verificationStatus === "verified") redirect("/agency");

  // 심사 대기 상태 — 안내 + 콘솔 미리보기
  if (agency?.verificationStatus === "pending") {
    return (
      <div className="mx-auto max-w-xl py-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Clock className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-neutral-900">
          {t("agency.verify.pendingTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          <span className="font-semibold text-neutral-700">
            {agency.companyName}
          </span>{" "}
          {t("agency.verify.pendingDesc")}
        </p>
        <Link
          href="/agency"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          {t("agency.verify.previewConsoleCta")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // 미신청(none) 또는 반려(rejected) → 인증 폼
  return (
    <div className="mx-auto max-w-xl py-4">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-neutral-900">
          {t("agency.verify.title")}
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          {agency?.verificationStatus === "rejected"
            ? t("agency.verify.rejectedDesc")
            : t("agency.verify.intro")}
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
