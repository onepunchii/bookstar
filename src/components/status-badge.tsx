import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  reviewing: "bg-neutral-900 text-white",
  negotiating: "bg-brand-50 text-brand-700",
  accepted: "bg-brand-500 text-white",
  rejected: "bg-neutral-200 text-neutral-500 line-through",
  completed: "border border-neutral-300 bg-white text-neutral-700",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge className={cn(STATUS_STYLES[status])}>{STATUS_LABELS[status]}</Badge>
  );
}
