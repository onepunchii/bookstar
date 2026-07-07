import { ARTISTS, getRatingSummary } from "./mock-data";
import type { Artist, ArtistCategory } from "./types";

export interface RecommendCriteria {
  budget: number; // 만원
  categories: ArtistCategory[];
  gender?: "male" | "female" | "group" | "any";
  tags: string[];
  minFollowers?: number;
}

export interface Recommendation {
  artist: Artist;
  score: number; // 0~100
  reasons: string[];
}

// 규칙 기반 스코어링 — 실 데이터/ML 없이도 설명 가능한 추천을 보장.
export function recommend(criteria: RecommendCriteria): Recommendation[] {
  const scored = ARTISTS.map((a) => {
    const reasons: string[] = [];
    let score = 0;

    // 카테고리 매칭 (25점) — 카테고리 안 고르면 균등 통과
    if (criteria.categories.length === 0) {
      score += 15;
    } else {
      const overlap = a.categories.filter((c) =>
        criteria.categories.includes(c)
      );
      if (overlap.length > 0) {
        score += 25;
        reasons.push(`카테고리 일치: ${overlap.join(", ")}`);
      } else {
        score -= 40; // 카테고리 안 맞으면 원천 페널티
      }
    }

    // 예산 매칭 (30점) — 예산이 아티스트 범위 안이면 만점
    const [lo, hi] = a.budgetRange;
    if (criteria.budget >= lo && criteria.budget <= hi) {
      score += 30;
      reasons.push(`예산 ${criteria.budget.toLocaleString()}만원이 섭외가 범위 내`);
    } else if (criteria.budget > hi) {
      score += 20;
      reasons.push("예산이 넉넉해 협상 우위");
    } else {
      const gap = (lo - criteria.budget) / lo;
      if (gap < 0.2) {
        score += 12;
        reasons.push("예산이 조금 낮지만 협의 여지 있음");
      } else {
        score -= 10;
      }
    }

    // 성별 (15점)
    if (!criteria.gender || criteria.gender === "any") {
      score += 8;
    } else if (a.gender === criteria.gender) {
      score += 15;
      const label =
        criteria.gender === "group"
          ? "그룹"
          : criteria.gender === "female"
            ? "여성"
            : "남성";
      reasons.push(`${label} 아티스트`);
    }

    // 태그 오버랩 (30점) — 이미지/브랜드 매칭
    if (criteria.tags.length > 0) {
      const overlap = a.tags.filter((t) =>
        criteria.tags.some((ct) => t.includes(ct) || ct.includes(t))
      );
      if (overlap.length > 0) {
        score += Math.min(30, overlap.length * 12);
        reasons.push(`이미지 매칭: ${overlap.slice(0, 3).join(", ")}`);
      }
    }

    // 최소 팔로워
    if (criteria.minFollowers && a.followers < criteria.minFollowers) {
      score -= 20;
    }

    // 리뷰 · 응답률 보너스
    const rating = getRatingSummary(a.id);
    if (rating.count > 0 && rating.avg >= 4.5) {
      score += 6;
      reasons.push(`리뷰 ${rating.avg}점 (${rating.count}건)`);
    }
    if (a.responseRate >= 97) {
      score += 4;
      reasons.push(`응답률 ${a.responseRate}% · 빠른 확답`);
    }

    return {
      artist: a,
      score: Math.max(0, Math.min(100, Math.round(score))),
      reasons,
    };
  });

  return scored
    .filter((r) => r.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
