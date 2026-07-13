"use client";

// 신고·차단 클라이언트 헬퍼 — 공개 프로필·협의 채팅 공용 (App Store 1.2).

export type ReportTarget = "artist_profile" | "chat" | "user";

export async function reportContent(
  targetType: ReportTarget,
  targetId: string | number,
  reason?: string
): Promise<boolean> {
  try {
    const r = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId: String(targetId), reason }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function blockUser(userId: string): Promise<boolean> {
  try {
    const r = await fetch("/api/block-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function unblockUser(userId: string): Promise<boolean> {
  try {
    const r = await fetch(
      `/api/block-user?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );
    return r.ok;
  } catch {
    return false;
  }
}
