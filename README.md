# BOOKSTAR

연예인·인플루언서 섭외를 가장 빠르게 연결하는 B2B 부킹 플랫폼.

## 스택

- **Next.js** (App Router, TypeScript, Tailwind CSS v4)
- **Neon Postgres** — Vercel Storage 연동, Drizzle ORM
- 배포: **Vercel**
- 디자인: 화이트 / 블랙 / 그레이 + 오렌지(`brand-500 #FF5A00`) 포인트

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

현재 화면은 `src/lib/mock-data.ts`의 목데이터로 동작합니다. DB 연결 없이 전체 플로우를 볼 수 있어요.

## Neon(DB) 연결

1. Vercel 프로젝트 생성 후 **Storage → Create Database → Neon** 선택
2. 로컬에서 환경변수 받기:
   ```bash
   npx vercel link
   npx vercel env pull .env.local
   ```
3. 스키마 반영:
   ```bash
   npm run db:push      # src/lib/db/schema.ts → Neon
   npm run db:studio    # 브라우저에서 데이터 확인
   ```

## 구조

| 경로 | 화면 |
|---|---|
| `/` | 홈 (히어로, 카테고리, 추천 아티스트) |
| `/artists` | 아티스트 검색 (카테고리·예산·키워드 필터) |
| `/artists/[id]` | 프로필 + 가능 일정 캘린더 + 섭외 CTA |
| `/booking/new?artist=` | 섭외 요청 폼 (표준 브리프) |
| `/requests` | 광고주: 보낸 요청 목록 |
| `/requests/[id]` | 요청 상세 + 협의 채팅 + 견적 |
| `/agency` | 소속사: 인박스 (수락/협의/거절) |

DB 스키마: `src/lib/db/schema.ts` — users, agencies, artists, schedules(공개 가능 여부 + 비공개 메모 분리), booking_requests, booking_status_history(감사 로그), messages(협의 스레드), quotes(견적 라운드), notifications.

## 로드맵

- **1차 (현재)**: 검색 → 요청 → 소속사 응답 → 협의 플로우
- **2차**: 인증(Auth.js), DB 연동, 전자계약(모두싸인 API), 결제·에스크로(PG), 관리자 대시보드
- **3차**: AI 추천 고도화, 리뷰, 광고 상품
