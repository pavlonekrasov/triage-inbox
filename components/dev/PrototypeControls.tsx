"use client";

import { SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { PillButton } from "@/components/controls/PillButton";
import { useDesk } from "@/components/desk/desk-store";
import type { ListState } from "@/lib/desk-params";

const LIST_STATES: { id: ListState; label: string }[] = [
  { id: "live", label: "Live queue" },
  { id: "loading", label: "First load" },
  { id: "empty", label: "Needs you is empty" },
];

/**
 * The prototype's dev panel (brief 14): switches to states a live click-through cannot reach on its
 * own. It lives in the list footer, so it never covers the thread or its decision bar, and opens
 * upward. Opaque, and removed from screenshots by the capture plans.
 */
export function PrototypeControls() {
  const { state, dispatch } = useDesk();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const label = open ? "Hide prototype controls" : "Show prototype controls";

  return (
    <div data-prototype-controls className="relative shrink-0">
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Prototype controls"
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setOpen(false);
          }}
          className="absolute right-0 bottom-full z-40 mb-2 w-60 rounded-card border border-border bg-popover p-3 text-popover-foreground"
        >
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-label">List state</legend>
            {LIST_STATES.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-body-s">
                <input
                  type="radio"
                  name="list-state"
                  value={option.id}
                  checked={state.listState === option.id}
                  onChange={() => dispatch({ type: "setListState", listState: option.id })}
                  className="size-4 accent-primary"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <p className="mt-3 text-micro text-muted-foreground">
            Send failure, offline and collision toggles arrive with those states.
          </p>
        </div>
      )}
      <PillButton
        iconOnly
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal aria-hidden strokeWidth={1.75} />
      </PillButton>
    </div>
  );
}
