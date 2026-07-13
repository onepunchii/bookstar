#!/usr/bin/env python3
"""XONG 스토어 스크린샷 원본 캡처 — 프로덕션 모바일 5장 → raw/01~05.png
사용: /Users/choejeonghwan/Desktop/Antigravity/봄여가울/store/screenshots/.venv/bin/python store/screenshots/capture.py
(venv=농사원펀치 store/screenshots 의 것 재사용)
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

DIR = Path(__file__).resolve().parent
(DIR / "raw").mkdir(parents=True, exist_ok=True)

SHOTS = [
    ("01.png", "https://www.xong.co.kr/"),            # 홈 — 수수료 0% 히어로 + Featured/세트
    ("02.png", "https://www.xong.co.kr/artists"),     # 아티스트 찾기 — 카테고리·예산 필터
    ("03.png", "https://www.xong.co.kr/@qwer"),       # 공개 프로필 — 섭외가·가용 캘린더
    ("04.png", "https://www.xong.co.kr/recommend"),   # AI 캐스팅 추천
    ("05.png", "https://www.xong.co.kr/guide"),       # 섭외 가이드
]

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=3,  # 1170x2532
        locale="ko-KR",
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    )
    # "샘플로 둘러보기" 플로팅 칩 숨김 (콘텐츠 가림 방지)
    ctx.add_init_script(
        """try { localStorage.setItem('bookstar-sample-dismissed','1');
                 localStorage.setItem('bookstar-sample-seen','1'); } catch(e) {}"""
    )
    pg = ctx.new_page()
    for fname, url in SHOTS:
        try:
            pg.goto(url, wait_until="networkidle", timeout=45000)
        except Exception:
            pass
        pg.wait_for_timeout(3500)  # 클라이언트 데이터 로딩("불러오는 중") 해소 대기
        pg.screenshot(path=str(DIR / "raw" / fname))
        print(f"✅ raw/{fname} ← {url}")
    b.close()
print("캡처 완료")
