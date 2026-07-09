// 소속사 인증 게이트 — 미인증(none/pending/rejected)일 때 콘솔 대신 전면 노출.
import Link from "next/link";
import type { SessionAgency } from "@/lib/data/session";
import { Clock, ShieldCheck } from "lucide-react";
import { VerifyForm } from "./verify/verify-form";

const FEATURES = "데일리 · 섭외 인박스 · 오픈 캠페인 · 일정 · 정산 · 서류함";

export function AgencyGate({ agency }: { agency: SessionAgency | null }) {
  // 심사 대기
  if (agency?.verificationStatus === "pending") {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
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
          인증 신청이 접수됐어요. 운영팀 승인이 완료되면 <br className="hidden sm:block" />
          <span className="font-semibold text-neutral-700">{FEATURES}</span> 를
          모두 사용할 수 있어요.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left text-xs text-neutral-500">
          평균 <span className="font-bold text-neutral-700">1 영업일</span> 내
          검토 · 승인되면 알림으로 알려드려요.
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-semibold text-neutral-400 hover:text-neutral-700"
        >
          광고주 홈으로 둘러보기
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
          소속사 인증
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          {agency?.verificationStatus === "rejected"
            ? "이전 신청이 반려됐어요. 서류를 다시 확인해 제출해 주세요."
            : "아티스트를 관리하려면 소속사 인증이 필요해요."}
        </p>
        <p className="mt-1.5 text-xs font-medium text-brand-600">
          인증이 완료되면 {FEATURES} 를 모두 사용할 수 있어요.
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
