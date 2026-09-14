"use client";

import { SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/controls/Button";
import { useDesk } from "@/components/desk/desk-store";
import { COLLEAGUE } from "@/data/team";
import { TICKETS_BY_ID } from "@/data/tickets";
import { canSimulateDraft, type DraftStatus } from "@/lib/decision";
import type { ListState } from "@/lib/desk-params";
import type { SendFailure } from "@/lib/send";

const LIST_STATES: { id: ListState; label: string }[] = [
  { id: "live", label: "Live queue" },
  { id: "loading", label: "First load" },
  { id: "empty", label: "Needs you is empty" },
];

const SEND_RESULTS: { id: SendFailure; label: string }[] = [
  { id: "off", label: "Sends succeed" },
  { id: "sometimes", label: "Fail 1 in 20 sends" },
  { id: "always", label: "Fail every send" },
];

const CONNECTION: { id: "online" | "offline"; label: string }[] = [
  { id: "online", label: "Online" },
  { id: "offline", label: "Offline, replies queue" },
];

const DRAFT_STATES: { id: DraftStatus | "ready"; label: string }[] = [
  { id: "ready", label: "Draft ready" },
  { id: "drafting", label: "Still drafting" },
  { id: "failed", label: "Couldn't draft" },
];

/**
 * The prototype's dev panel (brief 14): switches to the states in the catalogue (brief 12) that a live
 * click-through cannot reach on its own. It lives in the list footer, so it never covers the thread or
 * its decision bar, and opens upward. Opaque, and removed from screenshots by the capture plans.
 */
export function PrototypeControls() {
  const { state, dispatch } = useDesk();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const label = open ? "Hide prototype controls" : "Show prototype controls";
  const ticket = state.openId ? TICKETS_BY_ID.get(state.openId) : undefined;
  const firstName = ticket?.customer.name.split(" ")[0];
  const draftable = ticket !== undefined && canSimulateDraft(ticket) && !state.outbox[ticket.id];

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
          className="absolute right-0 bottom-full z-40 mb-2 flex max-h-[calc(100dvh-5rem)] w-64 flex-col gap-3 overflow-y-auto overscroll-contain rounded-card border border-border bg-popover p-3 text-popover-foreground"
        >
          <Choices
            legend="List state"
            options={LIST_STATES}
            value={state.listState}
            onChange={(listState) => dispatch({ type: "setListState", listState })}
          />
          <Choices
            legend="Send API"
            options={SEND_RESULTS}
            value={state.sendFailure}
            onChange={(sendFailure) => dispatch({ type: "setSendFailure", sendFailure })}
          />
          <Choices
            legend="Connection"
            options={CONNECTION}
            value={state.online ? "online" : "offline"}
            onChange={(id) => dispatch({ type: "setOnline", online: id === "online" })}
          />
          <Choices
            legend={firstName ? `AI draft for ${firstName}` : "AI draft"}
            options={DRAFT_STATES}
            value={ticket ? (state.draftStatus[ticket.id]?.status ?? "ready") : "ready"}
            disabled={!draftable}
            note={ticket && !draftable ? "Only for a conversation with an AI draft that has not been sent." : undefined}
            onChange={(id) => ticket && dispatch({ type: "setDraftStatus", id: ticket.id, status: id === "ready" ? null : id })}
          />
          <fieldset disabled={!ticket} className="flex flex-col gap-1.5">
            <legend className="mb-1 text-label">Collision</legend>
            <label className="flex items-center gap-2 text-body-s has-disabled:text-muted-foreground">
              <input
                type="checkbox"
                checked={ticket ? ticket.id in state.viewers : false}
                onChange={(event) => ticket && dispatch({ type: "setViewer", id: ticket.id, viewing: event.target.checked })}
                className="size-4 accent-primary"
              />
              {COLLEAGUE.firstName} is viewing {firstName ?? "the conversation"}
            </label>
          </fieldset>
        </div>
      )}
      <Button
        iconOnly
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal aria-hidden strokeWidth={1.75} />
      </Button>
    </div>
  );
}

function Choices<T extends string>({
  legend,
  options,
  value,
  disabled = false,
  note,
  onChange,
}: {
  legend: string;
  options: readonly { id: T; label: string }[];
  value: T;
  disabled?: boolean;
  note?: string;
  onChange: (id: T) => void;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-1.5">
      <legend className="mb-1 text-label">{legend}</legend>
      {options.map((option) => (
        <label key={option.id} className="flex items-center gap-2 text-body-s has-disabled:text-muted-foreground">
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            className="size-4 accent-primary"
          />
          {option.label}
        </label>
      ))}
      {note && <p className="text-micro text-muted-foreground">{note}</p>}
    </fieldset>
  );
}
