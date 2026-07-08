"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// 데모(테스터) → 실 소속사로 전환. 클릭 시 로그인 유저 소유 소속사 생성.
export function StartAgencyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/join/agency", { method: "POST" });
      if (res.status === 401) {
        router.push("/login?callbackUrl=/agency/artists");
        return;
      }
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("전환에 실패했어요. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={start}
      disabled={loading}
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      소속사로 시작하기
    </button>
  );
}
