"use client";

import { Menu } from "@base-ui/react/menu";
import { Ban, BellOff, Ellipsis, Link } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/controls/Button";
import { useDesk } from "@/components/desk/desk-store";
import { dismissBlock } from "@/lib/lanes";
import type { Ticket } from "@/lib/types";
import { useDemoNow } from "@/lib/use-demo-now";

/** The header pill's overflow menu (brief 7.4): Snooze, Mark spam, Copy link. Opaque, never glass. */
export function ThreadMenu({ ticket }: { ticket: Ticket }) {
  const { dispatch } = useDesk();
  const now = useDemoNow();
  const snoozeBlock = dismissBlock(ticket, "snoozed");
  const spamBlock = dismissBlock(ticket, "spam");

  const copyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => dispatch({ type: "notify", text: "Link to this conversation copied.", where: "thread" }))
      .catch(() =>
        dispatch({ type: "notify", text: "Couldn't copy the link. Copy it from the address bar.", where: "thread" }),
      );
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`More actions for the conversation with ${ticket.customer.name}`}
        render={<Button iconOnly />}
      >
        <Ellipsis aria-hidden strokeWidth={1.75} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50 outline-none">
          <Menu.Popup
            className={
              "w-64 origin-(--transform-origin) rounded-card border border-border bg-popover p-1 text-popover-foreground outline-none " +
              // Rare, so it may move (brief 10): scale 0.96 and fade in 160 ms from the trigger, out in 120 ms.
              "transition-[scale,opacity] duration-160 ease-out " +
              "data-starting-style:scale-96 data-starting-style:opacity-0 " +
              "data-ending-style:scale-96 data-ending-style:opacity-0 data-ending-style:duration-120 data-ending-style:ease-in " +
              "motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100"
            }
          >
            <Item
              icon={<BellOff aria-hidden strokeWidth={1.75} />}
              label="Snooze for 1 hour"
              blocked={snoozeBlock}
              onClick={() => dispatch({ type: "dismiss", id: ticket.id, kind: "snoozed", now })}
            />
            <Item
              icon={<Ban aria-hidden strokeWidth={1.75} />}
              label="Mark as spam"
              blocked={spamBlock}
              onClick={() => dispatch({ type: "dismiss", id: ticket.id, kind: "spam", now })}
            />
            <Item icon={<Link aria-hidden strokeWidth={1.75} />} label="Copy link to conversation" onClick={copyLink} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** A blocked item stays in the menu, disabled, with its reason in words: it never disappears silently. */
function Item({
  icon,
  label,
  blocked = null,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  blocked?: string | null;
  onClick: () => void;
}) {
  return (
    <Menu.Item
      disabled={blocked !== null}
      label={label}
      onClick={onClick}
      className="flex cursor-default gap-2.5 rounded-input px-2.5 py-2 outline-none max-md:min-h-11 max-md:items-center select-none data-disabled:text-muted-foreground data-highlighted:bg-accent [&_svg]:mt-px [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {icon}
      <span className="flex flex-col gap-0.5">
        <span className="text-label">{label}</span>
        {blocked && <span className="text-micro">{blocked}</span>}
      </span>
    </Menu.Item>
  );
}
