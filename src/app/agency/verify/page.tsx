import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAgency, getSessionUser } from "@/lib/data/session";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { VerifyForm } from "./verify-form";

export const dynamic = "force-dynamic";

export default async function AgencyVerifyPage() {
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
          인증 심사 중이에요
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          <span className="font-semibold text-neutral-700">
            {agency.companyName}
          </span>{" "}
          인증 신청이 접수됐어요. 운영팀 검토 후 승인되면 공개 프로필·정산이
          열립니다. 검토 중에도 콘솔은 미리 둘러볼 수 있어요.
        </p>
        <Link
          href="/agency"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          콘솔 둘러보기 <ArrowRight className="h-4 w-4" />
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
          소속사 인증
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          {agency?.verificationStatus === "rejected"
            ? "이전 신청이 반려됐어요. 서류를 다시 확인해 제출해주세요."
            : "아티스트를 관리하려면 소속사 인증이 필요해요. 서류 제출 후 승인되면 콘솔이 열립니다."}
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
