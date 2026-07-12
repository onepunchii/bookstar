import { RouteSpinner } from "@/components/route-spinner";

// 전역 로딩 경계 — 데이터 로드가 있는 라우트로 진입 시 즉시 스피너.
// (더 가까운 세그먼트에 loading.tsx가 있으면 그쪽이 우선한다: agency·me·artists·requests)
export default function Loading() {
  return <RouteSpinner />;
}
