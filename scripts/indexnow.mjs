// IndexNow 제출 — Bing·Yandex·Seznam 등에 URL 변경을 즉시 알림(빠른 색인).
// (Bing이 ChatGPT·Copilot 색인 소스라 AEO에도 직접 기여.)
//
// 사용:
//   node scripts/indexnow.mjs                 # 라이브 sitemap.xml의 모든 URL 제출
//   node scripts/indexnow.mjs <url> [url...]  # 지정 URL만 제출(신규 페이지 빠른 알림)
//
// 키 파일: public/<KEY>.txt (배포되어 https://www.xong.co.kr/<KEY>.txt 로 접근 가능해야 함)

const HOST = "www.xong.co.kr";
const ORIGIN = `https://${HOST}`;
const KEY = "c48236ed3dc89a51dfdc6a218f6b0ea3";
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

async function sitemapUrls() {
  const xml = await (await fetch(`${ORIGIN}/sitemap.xml`, { cache: "no-store" })).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  // 같은 호스트만
  return [...new Set(locs.filter((u) => u.startsWith(ORIGIN)))];
}

async function main() {
  const argUrls = process.argv.slice(2);
  const urlList = argUrls.length ? argUrls : await sitemapUrls();
  if (!urlList.length) {
    console.error("제출할 URL이 없습니다.");
    process.exit(1);
  }
  // IndexNow는 요청당 최대 10,000 URL
  const batches = [];
  for (let i = 0; i < urlList.length; i += 10000) batches.push(urlList.slice(i, i + 10000));

  for (const [i, batch] of batches.entries()) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }),
    });
    console.log(`배치 ${i + 1}/${batches.length} · ${batch.length}개 · HTTP ${res.status} ${res.statusText}`);
    // 200/202 = 수락, 4xx = 키/형식 문제
    if (res.status >= 400) console.log("  응답:", (await res.text()).slice(0, 300));
  }
  console.log(`제출 완료: 총 ${urlList.length}개 URL → IndexNow(Bing·Yandex 등)`);
}

main().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
