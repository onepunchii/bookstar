# xong 신기능 로드맵 (2026-07 확정)

목표: "연예인 Booking OS" — 인입(④) → 설득(②) → 실행(①) → 정산(기존) 플라이휠 완성.
근거 리서치: [RESEARCH.md](./RESEARCH.md) + 2026-07-07 신기능 리서치 (캘린더+날씨 / 화제성 대시보드 / 벤치마킹 / 아티스트 공개 페이지).

## 판정 요약

| 기능 | 판정 | 근거 |
|---|---|---|
| ④ 아티스트 공개 페이지 (EPK) | ✅ 1순위 | 해외 부킹 SaaS 검증된 인입 채널. CAC 0. 기존 프로필 데이터 재활용 |
| ② 화제성 대시보드 | ✅ 2순위 | 네이버 뉴스/데이터랩 + YouTube API 전부 무료. 한국 데이터 공백 = 우리 기회. 시계열 축적 자체가 해자 |
| ① 캘린더 + 날씨 | ✅ 3순위 | 기상청 무료(일 10만콜). Artist Growth에도 없는 기능. 매니저 '펑크 공포' 직접 타격 |
| ③ 벤치마킹 이식 | ⚠️ 선별 | Aggregated Day View(이미 데일리로 구현됨), read-only 공유, 실적 기반 등급만 채택 |

## 코드베이스 보정 사항 (리서치에 없던 것)

1. **DB 전환 선행**: UI가 아직 mock-data.ts를 읽음. ④를 첫 DB 네이티브 기능으로 삼아
   데이터 레이어(`src/lib/data.ts`, Neon 조회 + 목데이터 폴백) 패턴을 확립 → 기존 화면은 점진 전환.
2. **비로그인 인입 폼**: 공개 페이지의 "섭외 문의" CTA는 로그인 없는 폼 필요.
   `booking_requests.source='public_page'`로 인박스 직행 + 허니팟/rate limit 스팸 방지.
3. **뉴스 카운트 동명이인**: 아티스트별 커스텀 검색 쿼리 컬럼 (`"김서연" 배우` 식). 소속사가 설정에서 수정.
4. **기상청은 격자 좌표(nx,ny)**: location 텍스트 → 카카오 로컬 지오코딩 → 격자 변환 유틸 필요.
5. **Vercel Hobby 크론 = 일 1회**: 일별 수집엔 충분. Phase 3 실시간 급증 알림은 Pro 필요 → 그때 결정.

## Sprint 1 — 인입 (④ + 기반)

- [ ] **신뢰 레이어 P0** ([TRUST.md](./TRUST.md)): 신뢰 3단계 enum, 사업자/기획업 등록번호 필드,
      미검증 소속사는 공개 페이지 발행 불가, 신고 버튼
- [ ] `src/lib/data.ts` 데이터 레이어 (Neon + 폴백)
- [ ] `artists.slug` 컬럼 + 마이그레이션
- [ ] 공개 페이지 `/@슬러그`: 히어로(WebP)·태그·활동이력·가능/불가 캘린더·소속사 로고
- [ ] 비로그인 섭외 문의 폼 → 인박스 (`source='public_page'`)
- [ ] `@vercel/og` OG 이미지 (카톡 공유 카드)
- [ ] `.ics` 구독 피드 `/api/calendar/[artistId]`

완료 기준: 소속사가 링크를 명함/카톡 프로필에 걸 수 있다.

## Sprint 2 — 설득 (②)

- [ ] `artist_metrics` 테이블 (artistId, date, newsCount, searchTrend, ytSubs, ytViews, igFollowers)
- [ ] Vercel Cron 일 1회 수집: 네이버 뉴스 카운트 + YouTube channels.list(50개 배치)
- [ ] 아티스트별 검색 쿼리 설정 UI (동명이인 대응)
- [ ] SVG 스파크라인 (차트 라이브러리 없이) — 상세/공개 페이지/대시보드
- [ ] 팬덤 지수(누적 규모) / 화제성 지수(30일 증감) 산식 v1

완료 기준: "최근 30일 기사 N건 ↑" 그래프가 섭외 화면에 뜬다.

## Sprint 3 — 실행 (①+③)

- [ ] 카카오 지오코딩 → 기상청 격자 변환 유틸
- [ ] 날씨 뱃지: 단기(3일 예보)/중기(11일)/기후 평년값 3단 라벨 구분
- [ ] 우천 리스크 알림: 야외 행사 D-7/D-3 강수확률 임계치
- [ ] 데일리 시트 read-only 공유 링크 (Artist Growth 패턴)

## 필요 API 키 (전부 무료)

| 키 | 발급처 | 용도 |
|---|---|---|
| NAVER_CLIENT_ID/SECRET | developers.naver.com | 뉴스 검색(일 25,000콜) + 데이터랩(일 1,000콜) |
| YOUTUBE_API_KEY | console.cloud.google.com | 구독자·조회수 (일 10,000유닛) |
| KMA_SERVICE_KEY | data.go.kr | 단기·중기예보 (일 100,000콜) |
| KAKAO_REST_API_KEY | developers.kakao.com | 주소 → 위경도 지오코딩 |

## 하지 말 것 (확정)

- 인스타/틱톡 웹 스크래핑 — ToS·차단·B2B 신뢰도 리스크
- Spotify/글로벌 스트리밍 지표 자체 구축 — API 폐쇄. 필요시 Songstats Enterprise API 구매
- 초기 Google Calendar 양방향 동기화 — .ics로 충분, 유료 플랜 차별화로 후순위
