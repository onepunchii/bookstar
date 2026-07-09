// 소속사 유형별 아티스트 등록 한도.
// solo(1인 기획사·인플루언서) = 본인 1명. company(소속사·MCN) = 다수(현재 전면 무료 → 무제한).
// 확장은 계정·요금제에서 solo→company 업그레이드로.
export function artistLimit(agencyType: string): number {
  return agencyType === "solo" ? 1 : Infinity;
}

export function limitLabel(agencyType: string): string {
  return agencyType === "solo" ? "1팀" : "무제한";
}
