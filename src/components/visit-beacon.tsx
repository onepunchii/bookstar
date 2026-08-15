"use client";

import { useEffect } from "react";

// 일별 유니크 접속자 비콘 — 슈퍼관리자 대시보드의 "접속자" 지표를 채운다.
//
// ★ 하루 한 번만 보낸다. localStorage 에 "마지막으로 보낸 날짜"를 남겨 게이트하므로,
//   사용자가 페이지를 몇 번 이동해도 서버 쓰기는 1회다. 페이지뷰마다 보내면 트래픽이
//   늘수록 DB 비용·지연이 같이 늘어난다.
//
// 저장하는 것: 난수 방문자 ID 하나뿐이다. IP·계정·경로 어느 것도 보내지 않는다.
// 같은 브라우저를 다음날 다시 알아보는 것 외의 용도가 없다.

const ID_KEY = "xong-visitor"; // 난수 방문자 ID (영구)
const DAY_KEY = "xong-visit-day"; // 마지막 전송 날짜 (KST yyyy-mm-dd)

/** KST 기준 오늘 날짜. 서버도 Asia/Seoul 로 집계하므로 기준을 맞춘다. */
function kstToday(): string {
  // en-CA 는 yyyy-mm-dd 형식을 준다 — 직접 문자열을 조립하지 않아도 된다.
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export default function VisitBeacon() {
  useEffect(() => {
    try {
      const today = kstToday();
      if (localStorage.getItem(DAY_KEY) === today) return; // 오늘 이미 보냈다

      let id = localStorage.getItem(ID_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(ID_KEY, id);
      }

      // 낙관적으로 먼저 날짜를 적는다 — 전송이 실패해도 그날 재시도로 서버를 두드리지 않는다.
      // 집계가 한 명 덜 잡히는 것이, 실패할 때마다 계속 재시도하는 것보다 낫다.
      localStorage.setItem(DAY_KEY, today);

      void fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor: id }),
        keepalive: true, // 바로 이탈해도 전송이 끊기지 않게
      }).catch(() => {});
    } catch {
      // 시크릿 모드 등에서 localStorage 가 막힌 경우. 접속 집계는 부가 기능이므로 조용히 넘어간다.
    }
  }, []);

  return null;
}
