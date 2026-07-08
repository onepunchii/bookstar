import Link from "next/link";
import { Eyebrow } from "@/components/premium/eyebrow";
import { Reveal } from "@/components/premium/reveal";
import { getSessionProfile } from "@/lib/data/session";
import { LogIn, ShieldCheck } from "lucide-react";
import { MeAccountForm } from "./account-form";

export const metadata = { title: "내 계정" };

// 광고주 계정 프로필 — 개인/기업 구분·이름·회사명·연락처 수정.
export default async function MyAccountPage() {
  const me = await getSessionProfile();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
      <Reveal>
        <Eyebrow>Account</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
          내 계정
        </h1>
        <p className="mt-2 text-sm text-white/50">
          섭외 요청에 사용되는 광고주 프로필이에요. 개인·기업 모두 무료로
          이용할 수 있어요.
        </p>
      </Reveal>

      {me ? (
        <Reveal delay={80} className="mt-8">
          <MeAccountForm profile={me} />
        </Reveal>
      ) : (
        <Reveal delay={80} className="mt-8">
          <div className="adv-card rounded-[1.75rem] p-8 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-brand-500" />
            <p className="mt-4 text-lg font-bold text-white">
              로그인하면 내 프로필을 관리할 수 있어요
            </p>
            <p className="mt-1.5 text-sm text-white/50">
              지금 보고 있는 화면은 테스터용 데모 계정이에요. 카카오로
              시작하면 내 이름·회사명으로 섭외 요청이 나가요.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" /> 카카오로 시작하기
            </Link>
          </div>
        </Reveal>
      )}
    </div>
  );
}
