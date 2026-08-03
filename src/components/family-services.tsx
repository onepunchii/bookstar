"use client";

// 패밀리 서비스 카드 — 형제 서비스(mapix·rankue·onp·tohk·mudangk) 상호 홍보.
//
// 데이터(어느 스토어에 있나)는 src/lib/familyServices.ts 레지스트리가 갖고,
// 문구는 i18n 사전(family.*), 모양은 여기서 xong 디자인 언어(adv-card · brand 오렌지)로 그린다.
// 레지스트리는 6개 레포에 같은 내용으로 복제되므로 이 파일에서 수정하지 않는다.
//
// ★ 이미지·아이콘을 쓰지 않는다: 글자를 박은 배너는 10개 언어마다 다시 만들어야 하고
//   검색·AI 크롤러가 읽지 못한다. 칩 + 훅 제목 + 부제 텍스트로만 만든다.
//
// 문구 키 규칙: family.<id>.chip / family.<id>.title / family.<id>.desc
//   (xong 사전은 "account.form.name" 처럼 점으로 이어붙인 소문자 네임스페이스를 쓴다.
//    랭큐의 menu.<id>Chip 규칙과 다른 것은 각 사이트의 기존 규칙을 따르기 때문이다.)
import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  familyIsStore,
  familyOthers,
  familyTarget,
  withFamilyAttribution,
  type FamilyId,
  type FamilyPlatform,
} from "@/lib/familyServices";

const SELF: FamilyId = "xong";

// 훅과 착지점이 어긋나는 서비스가 있으면 여기서 웹 URL 로 고정한다. 지금은 비어 있다.
//
// (이력) tohk 카드는 한때 "무료 운세 · 꿈해몽" 훅이어서 스토어(=손편지로 브랜딩된 앱
//   페이지)로 보내면 훅과 화면이 어긋났고, 그래서 /saju 로 우회시켰다. 그런데 tohk 의
//   운세 기능은 애플 심사 대응으로 숨겨졌고 /saju 는 현재 빈 페이지다. 그래서 훅을
//   앱의 정체인 **손편지·기념일**로 바꿨고, 이제 예외 없이 기기별 스토어로 보낸다.
const WEB_ONLY: Partial<Record<FamilyId, string>> = {};

function detectPlatform(): FamilyPlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  // iPadOS 13+ 는 UA 에 iPad 가 없고 Mac 으로 위장한다 → 터치 포인트로 가른다.
  const iPadOS = /macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/.test(ua) || iPadOS) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

const ITEMS = familyOthers(SELF);

// UA 는 세션 중에 바뀌지 않으므로 구독할 것이 없다(빈 해지 함수만 돌려준다).
const subscribe = () => () => {};
const serverSnapshot = (): FamilyPlatform => "other";

// 서버 렌더·하이드레이션 시점에는 기기를 알 수 없으므로 "other"(=웹 링크)로 그리고,
// 하이드레이션 직후 실제 기기로 다시 그린다. 이 순서 덕분에 하이드레이션 불일치가 없고,
// 애플 기기에 Play 링크가 스쳐 지나가는 구간도 없다(웹 → App Store 로만 바뀐다).
// 애플 심사 지침이 앱 안에서 다른 모바일 플랫폼을 언급하는 것을 막는다.
function usePlatform(): FamilyPlatform {
  return useSyncExternalStore(subscribe, detectPlatform, serverSnapshot);
}

export function FamilyServices({ dark = false }: { dark?: boolean }) {
  const t = useT();
  // 네이티브 앱 안에서도 형제 서비스는 보여준다 — 홍보 대상이 다른 앱이므로
  // "이미 쓰는 사람에게 설치하라고 한다"는 사고가 아니다. 기기 판별은 UA 로 동일하게 된다.
  const platform = usePlatform();

  if (!ITEMS.length) return null;

  return (
    <section
      className={cn(
        "rounded-[1.75rem] p-6 sm:p-7",
        dark ? "adv-card" : "border border-neutral-200 bg-white",
      )}
    >
      <h2
        className={cn(
          "text-base font-bold",
          dark ? "text-white" : "text-neutral-900",
        )}
      >
        {t("family.title")}
      </h2>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {ITEMS.map((s) => {
          const override = WEB_ONLY[s.id];
          const href = withFamilyAttribution(
            override ?? familyTarget(s, platform),
            SELF,
          );
          const isStore = !override && familyIsStore(s, platform);
          return (
            <a
              key={s.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                // text-start: 아랍어(RTL)에서 카드 정렬이 함께 뒤집히도록 논리 속성 사용
                "block rounded-xl px-4 py-3.5 text-start ring-1 transition-colors",
                dark
                  ? "bg-white/[0.03] ring-white/10 hover:bg-white/[0.05] hover:ring-white/25"
                  : "bg-neutral-50 ring-neutral-200 hover:bg-white hover:ring-neutral-300",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  dark
                    ? "bg-brand-500/15 text-brand-300"
                    : "bg-brand-50 text-brand-700",
                )}
              >
                {t(`family.${s.id}.chip`)}
              </span>
              <p
                className={cn(
                  "mt-2 text-[15px] font-bold leading-snug",
                  dark ? "text-white" : "text-neutral-900",
                )}
              >
                {t(`family.${s.id}.title`)}
              </p>
              <p
                className={cn(
                  "mt-1 text-[13px] leading-snug",
                  dark ? "text-white/45" : "text-neutral-500",
                )}
              >
                {t(`family.${s.id}.desc`)}
              </p>
              {/* 착지점이 스토어면 그렇다고 미리 알린다. 스토어인 줄 모르고 눌렀다가
                  스토어가 뜨면 배신감이 들고, "설치"라 써놓고 웹이 뜨면 더 나쁘다. */}
              <p
                className={cn(
                  "mt-1.5 text-[12px] font-semibold",
                  dark ? "text-brand-400" : "text-brand-600",
                )}
              >
                {isStore ? t("family.getApp") : t("family.openWeb")}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
