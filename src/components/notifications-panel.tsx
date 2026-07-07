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
  Palmtree,
  Send,
  Star,
} from "lucide-react";

const ICON_BY_TYPE: Record<NotificationType, typeof Bell> = {
  hold_expiring: CalendarClock,
  new_request: Inbox,
  quote_accepted: CircleCheck,
  leave_approved: Palmtree,
  leave_submitted: Palmtree,
  review_received: Star,
  booking_accepted: CircleCheck,
  ai_intake: FileScan,
  day_broadcast: Send,
};

const ACCENT_BY_TYPE: Record<NotificationType, string> = {
  hold_expiring: "bg-brand-500/10 text-brand-600",
  new_request: "bg-neutral-900/10 text-neutral-900",
  quote_accepted: "bg-brand-500/10 text-brand-600",
  leave_approved: "bg-brand-500/10 text-brand-600",
  leave_submitted: "bg-neutral-900/10 text-neutral-900",
  review_received: "bg-brand-500/10 text-brand-600",
  booking_accepted: "bg-brand-500/10 text-brand-600",
  ai_intake: "bg-brand-500/10 text-brand-600",
  day_broadcast: "bg-neutral-900/10 text-neutral-900",
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { role } = useRoleStore();
  const { items, markAllRead, markRead } = useNotificationsStore();

  const roleItems = items.filter((n) => n.role === role);
  const unread = roleItems.filter((n) => !n.readAt).length;

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
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
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
                onClick={() => markAllRead(role)}
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
                  const Icon = ICON_BY_TYPE[n.type];
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
                          ACCENT_BY_TYPE[n.type]
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
                            markRead(n.id);
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
