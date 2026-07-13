"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Flag, Ban, Check } from "lucide-react";
import { reportContent, blockUser, type ReportTarget } from "@/lib/safety";

interface Props {
  /** 신고 대상 유형 */
  targetType: ReportTarget;
  /** 신고 대상 id (아티스트 id·요청 id·유저 id 등) */
  targetId: string | number;
  /** 차단할 상대 유저 id — 없으면 차단 항목 숨김 */
  targetUserId?: string | null;
  /** 차단 완료 후 콜백 (클라이언트 부모에서만 전달 가능 — 목록 제거·이동용) */
  onBlocked?: () => void;
  /** 로그인 여부 — false면 신고/차단 대신 로그인 페이지로 안내 */
  loggedIn?: boolean;
  /** 어두운 배경 위에 놓일 때 (협의 채팅 헤더·공개 프로필 등) */
  dark?: boolean;
}

// ⋯ 신고·차단 메뉴 — 모든 UGC 표면 공용 (App Store 1.2, onp/mapix 검증 패턴).
export function SafetyMenu({
  targetType,
  targetId,
  targetUserId,
  onBlocked,
  loggedIn = true,
  dark = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const guard = () => {
    if (!loggedIn) {
      setOpen(false);
      // 공개 페이지(앱 셸 밖)에는 로그인 모달이 없으므로 로그인 페이지로 이동
      window.location.href = `/login?callbackUrl=${encodeURIComponent(
        window.location.pathname + window.location.search
      )}`;
      return false;
    }
    return true;
  };

  const doReport = async () => {
    if (!guard()) return;
    const ok = await reportContent(targetType, targetId);
    setReported(true);
    setTimeout(() => {
      setOpen(false);
      setReported(false);
    }, 1100);
    if (!ok) alert("신고 접수에 실패했어요. 잠시 후 다시 시도해 주세요.");
  };

  const doBlock = async () => {
    if (!guard() || !targetUserId) return;
    if (
      !confirm(
        "이 사용자를 차단할까요?\n차단하면 이 사용자와 협의 메시지를 주고받을 수 없게 됩니다."
      )
    )
      return;
    const ok = await blockUser(targetUserId);
    setOpen(false);
    if (ok) {
      if (onBlocked) onBlocked();
      else alert("차단했어요. 이 사용자와는 더 이상 대화할 수 없습니다.");
    } else {
      alert("차단에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="신고·차단 메뉴"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          dark
            ? "text-white/55 hover:bg-white/10 active:bg-white/10"
            : "text-neutral-400 hover:bg-neutral-100 active:bg-neutral-100"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 min-w-[176px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              doReport();
            }}
            className="flex w-full items-center gap-2 px-3.5 py-3 text-[13px] font-bold text-red-600 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
          >
            {reported ? (
              <>
                <Check className="h-3.5 w-3.5" /> 신고가 접수됐어요
              </>
            ) : (
              <>
                <Flag className="h-3.5 w-3.5" /> 신고하기
              </>
            )}
          </button>
          {targetUserId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                doBlock();
              }}
              className="flex w-full items-center gap-2 border-t border-neutral-200 px-3.5 py-3 text-[13px] font-bold text-neutral-900 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
            >
              <Ban className="h-3.5 w-3.5" /> 사용자 차단
            </button>
          )}
        </div>
      )}
    </div>
  );
}
