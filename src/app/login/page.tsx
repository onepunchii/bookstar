import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { EulaConsent } from "@/components/eula-consent";
import { Wordmark } from "@/components/wordmark";

export const metadata = {
  title: "로그인 · xong",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  const redirectTo = callbackUrl || "/agency";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" aria-label="xong 홈">
            <Wordmark height={28} />
          </Link>
          <p className="text-sm text-neutral-500">
            소속사·크리에이터 콘솔에 로그인하세요
          </p>
        </div>

        {session?.user ? (
          <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 text-center">
            <p className="text-sm text-neutral-600">
              <span className="font-bold text-neutral-900">
                {session.user.name ?? session.user.email ?? "사용자"}
              </span>
              님으로 로그인됨
            </p>
            <Link
              href={redirectTo}
              className="flex h-11 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white"
            >
              콘솔로 이동
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-xs font-semibold text-neutral-400 hover:text-neutral-700"
              >
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("kakao", { redirectTo });
            }}
          >
            {/* EULA 동의 체크 전에는 제출 비활성 — App Store 1.2 */}
            <EulaConsent label="카카오로 3초 만에 로그인" redirectTo={redirectTo} />
          </form>
        )}

        <p className="mt-6 text-center text-xs text-neutral-400">
          <Link href="/terms" className="underline">
            이용약관
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="underline">
            개인정보처리방침
          </Link>
        </p>
      </div>
    </div>
  );
}
