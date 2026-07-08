import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
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
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[15px] font-bold text-[#191600] transition-opacity hover:opacity-90"
            >
              <KakaoIcon className="h-5 w-5" />
              카카오로 3초 만에 로그인
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-neutral-400">
          로그인 시 xong 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

function KakaoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3C6.99 3 3 6.14 3 10.01c0 2.5 1.67 4.69 4.18 5.94-.18.63-.66 2.3-.76 2.66-.12.45.16.44.35.32.15-.1 2.35-1.6 3.3-2.25.63.09 1.28.14 1.93.14 5.01 0 9-3.14 9-7.01C21 6.14 17.01 3 12 3z" />
    </svg>
  );
}
