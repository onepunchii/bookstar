"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  formatRelative,
  useNotificationsStore,
  type NotificationType,
} from "@/lib/notifications-store";
import { useRoleStore } from "@/lib/role-store";
import { cn } from "@/lib/utils";
import {
  Bell,
  CalendarClock,
  Check,
  CircleCheck,
  FileScan,
  Inbox,
  Megaphone,
  MessageSquare,
  Palmtree,
  Send,
  Star,
} from "lucide-react";

const ICON_BY_TYPE: Record<NotificationType, typeof Bell> = {
  hold_expiring: CalendarClock,
  new_request: Inbox,
  quote_accepted: CircleCheck,
  quote_received: CircleCheck,
  message: MessageSquare,
  leave_approved: Palmtree,
  leave_rejected: Palmtree,
  leave_submitted: Palmtree,
  review_received: Star,
  booking_accepted: CircleCheck,
  campaign_application: Megaphone,
  campaign_selected: CircleCheck,
  campaign_rejected: Megaphone,
  agency_signup: FileScan,
  feedback: MessageSquare,
  ai_intake: FileScan,
  day_broadcast: Send,
};

const ACCENT_BY_TYPE: Record<NotificationType, string> = {
  hold_expiring: "bg-brand-500/10 text-brand-600",
  new_request: "bg-neutral-900/10 text-neutral-900",
  quote_accepted: "bg-brand-500/10 text-brand-600",
  quote_received: "bg-brand-500/10 text-brand-600",
  message: "bg-neutral-900/10 text-neutral-900",
  leave_approved: "bg-brand-500/10 text-brand-600",
  leave_rejected: "bg-neutral-900/10 text-neutral-900",
  leave_submitted: "bg-neutral-900/10 text-neutral-900",
  review_received: "bg-brand-500/10 text-brand-600",
  booking_accepted: "bg-brand-500/10 text-brand-600",
  campaign_application: "bg-brand-500/10 text-brand-600",
  campaign_selected: "bg-brand-500/10 text-brand-600",
  campaign_rejected: "bg-neutral-900/10 text-neutral-900",
  agency_signup: "bg-brand-500/10 text-brand-600",
  feedback: "bg-neutral-900/10 text-neutral-900",
  ai_intake: "bg-brand-500/10 text-brand-600",
  day_broadcast: "bg-neutral-900/10 text-neutral-900",
};

interface DbNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  createdAt: string;
  readAt?: string;
}

export function NotificationsPanel({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { role } = useRoleStore();
  const { items, markAllRead, markRead } = useNotificationsStore();
  // DB 알림 (실제 이벤트) — 역할별 fetch, 스토어 시드와 병합
  const [dbItems, setDbItems] = useState<DbNotification[]>([]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/notifications?role=${role}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: DbNotification[] }) => {
        if (alive) setDbItems(d.items);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [role, open]);

  const seedItems = items.filter((n) => n.role === role);
  const roleItems = [...dbItems, ...seedItems].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const unread = roleItems.filter((n) => !n.readAt).length;
  const isDbId = (id: string) => /^[0-9a-f-]{36}$/.test(id);

  const readOne = (id: string) => {
    if (isDbId(id)) {
      setDbItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], role }),
      }).catch(() => {});
    } else {
      markRead(id);
    }
  };

  const readAll = () => {
    markAllRead(role);
    setDbItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true, role }),
    }).catch(() => {});
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="알림"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          dark
            ? "text-white/60 hover:bg-white/10"
            : "text-neutral-500 hover:bg-neutral-100"
        )}
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[92vw] max-w-sm overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/5">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-bold">
              알림
              {unread > 0 && (
                <span className="ml-2 text-xs font-bold text-brand-600">
                  새 알림 {unread}
                </span>
              )}
            </p>
            {unread > 0 && (
              <button
                onClick={readAll}
                className="text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-900"
              >
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {roleItems.length === 0 ? (
              <p className="py-14 text-center text-sm text-neutral-400">
                받은 알림이 없어요
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {roleItems.map((n) => {
                  const Icon =
                    ICON_BY_TYPE[n.type as NotificationType] ?? Bell;
                  const item = (
                    <div
                      className={cn(
                        "flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-50",
                        !n.readAt && "bg-brand-50/40"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          ACCENT_BY_TYPE[n.type as NotificationType] ??
                            "bg-brand-500/10 text-brand-600"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold">
                            {n.title}
                          </p>
                          {!n.readAt && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-400">
                          {formatRelative(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => {
                            readOne(n.id);
                            setOpen(false);
                          }}
                        >
                          {item}
                        </Link>
                      ) : (
                        <button
                          onClick={() => markRead(n.id)}
                          className="block w-full text-left"
                        >
                          {item}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2.5 text-center text-[11px] text-neutral-400">
            <Check className="mr-1 inline h-3 w-3" />
            알림은 역할별로 표시돼요
          </div>
        </div>
      )}
    </div>
  );
}
