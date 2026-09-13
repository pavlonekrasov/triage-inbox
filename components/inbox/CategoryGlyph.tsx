import {
  CircleQuestionMark,
  CreditCard,
  Inbox,
  MessageSquareWarning,
  Repeat,
  ShieldCheck,
  Undo2,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { CategoryPrimary } from "@/lib/types";

export const CATEGORY: Record<CategoryPrimary, { icon: LucideIcon; label: string }> = {
  subscription: { icon: Repeat, label: "Subscription" },
  billing: { icon: CreditCard, label: "Billing" },
  technical: { icon: Wrench, label: "Technical" },
  refund: { icon: Undo2, label: "Refund" },
  advisor_complaint: { icon: MessageSquareWarning, label: "Advisor complaint" },
  account: { icon: UserRound, label: "Account" },
  product_question: { icon: CircleQuestionMark, label: "Product question" },
  privacy: { icon: ShieldCheck, label: "Privacy" },
  other: { icon: Inbox, label: "Other" },
};

/** 16px category glyph for the list preview line, with its name for screen readers. */
export function CategoryGlyph({ category }: { category: CategoryPrimary }) {
  const { icon: Icon, label } = CATEGORY[category];
  return (
    <>
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      <span className="sr-only">{label}: </span>
    </>
  );
}
