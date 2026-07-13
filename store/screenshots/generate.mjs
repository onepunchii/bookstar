// XONG 스토어 스크린샷 목업 생성기 — 실화면 캡처 + 브랜드(화이트·오렌지) 배경 + 카피
// 사용: node store/screenshots/generate.mjs                              → 애플 6.5" 1284×2778 (out/)
//       W=1080 H=2160 OUT=out-play node store/screenshots/generate.mjs  → 플레이 2:1 (out-play/)
//       FEATURE=1 node store/screenshots/generate.mjs                   → 플레이 그래픽 이미지 1024×500 (out-play/feature-graphic.png)
// (농사원펀치 store/screenshots/generate.mjs 이식 — 라이트 테마, 포인트 #FF5A00)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const W = Number(process.env.W || 1284), H = Number(process.env.H || 2778);
const OUT = process.env.OUT || "out";

const ORANGE = "#FF5A00";

function shoot(htmlPath, out, w, h) {
  execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    `--window-size=${w},${h}`, `--screenshot=${out}`, `file://${htmlPath}`,
  ], { stdio: "pipe" });
}

// ── 플레이 스토어 그래픽 이미지(1024×500) ──────────────────────────────
if (process.env.FEATURE === "1") {
  const icon = resolve(DIR, "..", "icon-512.png");
  const iconSrc = existsSync(icon) ? icon : resolve(DIR, "..", "..", "public", "app.png");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1024px; height:500px; overflow:hidden; }
  body {
    background:#ffffff; position:relative;
    font-family:-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
    display:flex; align-items:center; gap:56px; padding:0 84px;
  }
  .glow { position:absolute; inset:0;
    background:
      radial-gradient(620px 420px at 88% -60px, rgba(255,90,0,0.22), transparent 70%),
      radial-gradient(520px 380px at 4% 110%, rgba(255,90,0,0.12), transparent 70%);
  }
  img.icon { width:216px; height:216px; border-radius:48px; position:relative;
    box-shadow:0 24px 60px rgba(255,90,0,0.28), 0 6px 18px rgba(0,0,0,0.12); }
  .txt { position:relative; color:#0a0a0a; }
  .txt h1 { font-size:58px; font-weight:800; letter-spacing:-1.8px; line-height:1.22; white-space:nowrap; }
  .txt h1 em { font-style:normal; color:${ORANGE}; }
  .txt p { margin-top:22px; font-size:30px; font-weight:600; color:#3d3d3d; letter-spacing:-0.5px; white-space:nowrap; }
  </style></head><body>
    <div class="glow"></div>
    <img class="icon" src="file://${iconSrc}">
    <div class="txt">
      <h1>연예인·인플루언서 섭외,<br>수수료 0%로 <em>가장 빠르게</em></h1>
      <p>섭외가 공개 · 검증된 소속사와 직접 — XONG</p>
    </div>
  </body></html>`;
  mkdirSync(resolve(DIR, "out-play"), { recursive: true });
  const htmlPath = resolve(DIR, "out-play", ".tmp-feature.html");
  writeFileSync(htmlPath, html);
  shoot(htmlPath, resolve(DIR, "out-play", "feature-graphic.png"), 1024, 500);
  console.log("✅ out-play/feature-graphic.png (1024×500)");
  process.exit(0);
}

const { slides, captions } = JSON.parse(readFileSync(resolve(DIR, "captions.json"), "utf8"));

for (const s of slides) {
  if (!existsSync(resolve(DIR, "raw", s.file))) {
    console.error(`❌ raw/${s.file} 없음 — capture.py 먼저 실행`);
    process.exit(1);
  }
}

function slideHtml(imgPath, caption) {
  const lines = caption.split("\n").map((l) => l.trim());
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${W}px; height:${H}px; overflow:hidden; }
  body {
    background:#ffffff;
    font-family:-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
    position:relative;
  }
  /* 브랜드 글로우 — XONG 오렌지 */
  .glow { position:absolute; inset:0;
    background:
      radial-gradient(900px 700px at 50% -80px, rgba(255,90,0,0.22), transparent 70%),
      radial-gradient(700px 500px at 88% 30%, rgba(255,90,0,0.09), transparent 70%),
      radial-gradient(800px 600px at 6% 80%, rgba(255,90,0,0.07), transparent 70%);
  }
  .cap {
    position:absolute; top:150px; left:70px; right:70px;
    text-align:center; color:#0a0a0a; font-weight:800;
    font-size:100px; line-height:1.18; letter-spacing:-2.5px;
    text-wrap:balance;
  }
  .device {
    position:absolute; left:50%; transform:translateX(-50%);
    top:${lines.length > 1 ? 505 : 405}px;
    width:1020px; border-radius:112px; overflow:hidden;
    border:9px solid #1c1c1c;
    box-shadow: 0 60px 140px rgba(10,10,10,0.30), 0 0 0 2px rgba(0,0,0,0.04), 0 30px 110px rgba(255,90,0,0.20);
    background:#000;
  }
  .device img { display:block; width:100%; }
  </style></head><body>
    <div class="glow"></div>
    <div class="cap">${lines.join("<br>")}</div>
    <div class="device"><img src="${imgPath}"></div>
  </body></html>`;
}

let total = 0;
for (const [locale, caps] of Object.entries(captions)) {
  const outDir = resolve(DIR, OUT, locale);
  mkdirSync(outDir, { recursive: true });
  slides.forEach((s, i) => {
    const img = resolve(DIR, "raw", s.file);
    const html = slideHtml(`file://${img}`, caps[s.key]);
    const htmlPath = resolve(DIR, OUT, `.tmp-${locale}-${s.key}.html`);
    writeFileSync(htmlPath, html);
    const out = resolve(outDir, `${i + 1}-${s.key}.png`);
    shoot(htmlPath, out, W, H);
    total++;
    console.log(`✅ ${OUT}/${locale}/${i + 1}-${s.key}.png`);
  });
}
console.log(`\n완료: ${total}장`);
