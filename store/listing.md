# XONG 스토어 등록 정보 (한국 전용)

공통: 개인정보처리방침 URL = https://www.xong.co.kr/privacy · 지원 이메일 = petudy@kakao.com
⚠️ 제출 전 확인: `/privacy`·`/terms` 라우트가 코드에는 있으나 현재 프로덕션에서 404 — 배포 후 제출할 것.
아이콘: `store/icon-1024.png` (App Store) · `store/icon-512.png` (Play)
스크린샷: 애플 `store/screenshots/out/ko/` (1284×2778, 5장) · 플레이 `store/screenshots/out-play/ko/` (1080×2160, 5장) + `store/screenshots/out-play/feature-graphic.png` (1024×500)

---

## Google Play

**앱 이름** (30자): XONG - 연예인·인플루언서 섭외
**짧은 설명** (80자): 섭외가 공개, 매칭 수수료 0%. 검증된 소속사와 직접 — 연예인·인플루언서 섭외를 가장 빠르게.
**카테고리**: **비즈니스**
**태그**: 섭외, 캐스팅, 마케팅

**전체 설명** (4000자 이내):

🎤 XONG — 연예인·인플루언서 섭외를 가장 빠르게

행사·광고 캐스팅, 아직도 대행사 견적만 기다리시나요?
XONG은 검증된 소속사와 광고주를 직접 연결하는 B2B 부킹 플랫폼입니다.

💰 섭외가 공개 · 매칭 수수료 0%
- 아티스트별 섭외가 범위를 프로필에서 바로 확인
- 다단계 대행 거품 없이 소속사 공식 창구와 직접 협의
- XONG의 매칭 수수료는 0%

🔍 아티스트 찾기
- 아이돌·배우·모델·MC·인플루언서·스포츠·강연자 카테고리
- 예산 필터 + '다음주 가능한 여자 아이돌' 같은 자연어 검색
- 팔로워·응답률·평균 응답 시간까지 투명하게 공개

✨ AI 캐스팅 추천
- 예산·카테고리·이미지 태그만 넣으면 5초 만에 매칭
- 단순 필터가 아니라 '왜 이 아티스트인지' 이유까지 제시

📅 가능 일정까지 프로필에서
- 아티스트 공개 프로필에서 월별 가용 캘린더 확인
- 행사 개요·예산·날짜를 보내면 소속사에 바로 전달
- 평균 12시간 내 응답

📦 세트 섭외
- MC+연사, 헤드라이너+서브 등 검증된 조합을 한 번에
- 세트 할인으로 더 완성도 높은 라인업

📖 섭외 가이드
- 등급별 시세, 견적에 숨은 거품 구조, 계약 체크리스트
- 대학축제·기업행사·지역축제 실전 가이드

행사 기획자, 마케팅 담당자, 총학생회 — 처음 섭외를 맡아도 XONG이면 5분 안에 첫 요청까지 끝납니다.

문의: petudy@kakao.com

**데이터 보안 섹션(설문) 메모**:
- 수집: 이메일·이름(계정, 카카오 로그인), 회사/소속 정보(B2B 프로필), 앱 상호작용
- 공유: 없음 / 암호화 전송: 예 / 삭제 요청 가능: 예
- 광고 ID: **아니요** (광고 SDK 없음 — 매니페스트 확인 후 선언)

---

## App Store

**이름** (30자): XONG - 연예인·인플루언서 섭외
**부제** (30자): 섭외가 공개 · 수수료 0% 캐스팅
**프로모션 텍스트** (170자): 섭외가 공개, 매칭 수수료 0%. 검증된 소속사와 직접 협의하는 B2B 부킹 플랫폼. AI 캐스팅 추천으로 예산에 딱 맞는 아티스트를 5초 만에 찾아보세요.
**키워드** (100자, 쉼표): 섭외,캐스팅,연예인,인플루언서,아이돌,행사,대학축제,MC,모델,강연,부킹,소속사,광고,협찬
**카테고리**: 기본 **비즈니스** / 보조 엔터테인먼트

**설명**: (Play 전체 설명과 동일 — 이모지 포함 그대로 사용 가능)

**심사 노트(Review Notes) 영문 초안**:

> XONG is a B2B booking platform that connects advertisers (event organizers, marketing teams) directly with verified talent agencies for booking celebrities and influencers in Korea.
>
> **No login required for core browsing**: The home feed, artist discovery (/artists), public artist profiles, AI casting recommendation (/recommend), and booking guides (/guide) are all accessible without an account. You can review the main functionality immediately after launch.
>
> **Sign-in**: The app currently offers Kakao Login (the dominant identity provider in Korea, our sole target market). Sign in with Apple will be added in an upcoming build before/alongside any expansion of login options, per guideline 4.8. [빌드에 애플 로그인 추가 완료 시 이 문장을 "Sign in with Apple is supported" 로 교체]
>
> **Demo account**: Logged-in features (sending booking requests, messaging with agencies, campaign management) require a business account. Please use the demo account below to review these flows:
> - ID: [데모 계정 이메일 — 제출 전 생성 필요]
> - PW: [비밀번호]
> (카카오 OAuth 우회용 자체 데모 로그인 경로가 필요하면 buzz의 iris API 우회 패턴 참조)
>
> - All artist data shown in the current build is curated sample/partner data for service launch.
> - Account deletion: available in-app under Settings, plus contact on our privacy page.
> - Contact: petudy@kakao.com

**수출 규정(암호화)**: ITSAppUsesNonExemptEncryption = false (HTTPS 표준만 사용)

---

## 제출 전 체크리스트
1. `/privacy`·`/terms` 프로덕션 배포 확인 (현재 404)
2. 심사용 데모 계정 생성 + 심사 노트 빈칸 채우기
3. iOS: Sign in with Apple 추가 여부 결정 (카카오 로그인만 있으면 4.8 리젝 위험 — 게스트 브라우징이 넓어 통과 사례도 있으나 애플 로그인 추가가 안전)
4. Play 내부 테스트: 개인 계정이면 테스터 12명 × 14일 요건 (buzz와 동일)
