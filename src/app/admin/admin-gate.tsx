import Link from "next/link";
import { ShieldAlert } from "lucide-react";

// 관리자 아닌 접근 시 공통 안내. requireAdmin()이 null이면 렌더.
export function AdminGate() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-white/30" />
      <h1 className="mt-4 text-xl font-black tracking-tight text-white">
        관리자 전용
      </h1>
      <p className="mt-3 text-sm text-white/50">
        이 페이지는 xong 운영 관리자만 접근할 수 있어요. 카카오로 로그인한 뒤
        관리자 계정으로 다시 접속해 주세요.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
      >
        홈으로
      </Link>
    </div>
  );
}
