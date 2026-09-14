"use client";

import { Popover } from "@base-ui/react/popover";
import { Check, UsersRound } from "lucide-react";
import { useId, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/controls/Button";
import { KeyHint } from "@/components/controls/KeyHint";
import { useDesk } from "@/components/desk/desk-store";
import { escalationDefaults, reasonOptions, TEAMS, teamLabel } from "@/lib/escalation";
import type { EscalationTeam, Ticket } from "@/lib/types";
import { readDemoNow } from "@/lib/use-demo-now";
import { cn } from "@/lib/utils";
import { BAR_BUTTON } from "./DecisionBar";

const CHIP =
  "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-label select-none [&_svg]:size-3.5 [&_svg]:shrink-0";

/**
 * Escalate grows from its button as an inline popover, never a modal (brief 9.1): team, reasons and
 * a handoff note, prefilled from the AI's suggestion and editable. Opaque, like every popover (6.5).
 * Rare, so it may move: scale 0.96 and fade from the trigger over 160 ms, out over 120 ms.
 */
export function EscalatePopover({ ticket }: { ticket: Ticket }) {
  const { state, dispatch } = useDesk();
  const firstField = useRef<HTMLInputElement>(null);

  return (
    <Popover.Root open={state.escalateOpen} onOpenChange={(open) => dispatch({ type: "setEscalateOpen", open })}>
      <Popover.Trigger aria-keyshortcuts="H" render={<Button size="md" className={BAR_BUTTON} />}>
        <UsersRound aria-hidden strokeWidth={1.75} />
        Escalate case
        <KeyHint>H</KeyHint>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="end" sideOffset={12} className="z-50 outline-none">
          <Popover.Popup
            initialFocus={firstField}
            data-escalate-popover
            className={
              "w-100 max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-card border border-border bg-popover p-4 text-popover-foreground outline-none " +
              "transition-[scale,opacity] duration-160 ease-out " +
              "data-starting-style:scale-96 data-starting-style:opacity-0 " +
              "data-ending-style:scale-96 data-ending-style:opacity-0 data-ending-style:duration-120 data-ending-style:ease-in " +
              "motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100"
            }
          >
            <EscalateForm
              ticket={ticket}
              firstField={firstField}
              onCancel={() => dispatch({ type: "setEscalateOpen", open: false })}
              onSubmit={(values) => dispatch({ type: "escalate", ...values, now: readDemoNow() })}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function EscalateForm({
  ticket,
  firstField,
  onCancel,
  onSubmit,
}: {
  ticket: Ticket;
  firstField: RefObject<HTMLInputElement | null>;
  onCancel: () => void;
  onSubmit: (values: { team: EscalationTeam; reasons: string[]; note: string }) => void;
}) {
  // The popup unmounts when it closes, so each opening starts again from the AI's suggestion.
  const [defaults] = useState(() => escalationDefaults(ticket));
  const [team, setTeam] = useState(defaults.team);
  const [reasons, setReasons] = useState(defaults.reasons);
  const [note, setNote] = useState(defaults.note);
  const [showBlock, setShowBlock] = useState(false);
  const id = useId();

  const options = reasonOptions(ticket, team);
  const blocked = note.trim() ? null : "Add a handoff note so the team knows what to do.";

  const submit = () => {
    if (blocked) return setShowBlock(true);
    onSubmit({ team, reasons: reasons.filter((r) => options.includes(r)), note: note.trim() });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-3.5"
    >
      <div className="flex flex-col gap-0.5">
        <Popover.Title className="text-label">Escalate to a team</Popover.Title>
        <Popover.Description className="text-micro text-muted-foreground">
          {ticket.customer.name} leaves your queue with this note. You can undo it for 6 seconds.
        </Popover.Description>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-micro text-muted-foreground">Team</legend>
        <div className="flex flex-wrap gap-1.5">
          {TEAMS.map((t) => (
            <label key={t.id}>
              <input
                ref={t.id === defaults.team ? firstField : undefined}
                type="radio"
                name={`${id}-team`}
                value={t.id}
                checked={team === t.id}
                onChange={() => setTeam(t.id)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  CHIP,
                  "border-border bg-card peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-solid peer-focus-visible:outline-ring",
                )}
              >
                {team === t.id && <Check aria-hidden strokeWidth={2} />}
                {t.label}
              </span>
            </label>
          ))}
        </div>
        {defaults.suggestedTeam && (
          <p className="text-micro text-muted-foreground">Suggested by the AI: {teamLabel(defaults.suggestedTeam)}</p>
        )}
      </fieldset>

      <fieldset className="flex flex-col">
        <legend className="mb-1.5 text-micro text-muted-foreground">Reason</legend>
        <div className="flex flex-wrap gap-1.5">
          {options.map((reason) => {
            const on = reasons.includes(reason);
            return (
              <Button
                key={reason}
                variant="outline"
                aria-pressed={on}
                onClick={() => setReasons(on ? reasons.filter((r) => r !== reason) : [...reasons, reason])}
                className="gap-1 [&_svg]:size-3.5"
              >
                {on && <Check aria-hidden strokeWidth={2} />}
                {reason}
              </Button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-micro text-muted-foreground">Handoff note</span>
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setShowBlock(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              submit();
            }
          }}
          className="field-sizing-content max-h-48 min-h-20 resize-none rounded-input border border-border bg-card px-3 py-2 text-body-s outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-solid focus-visible:outline-ring"
        />
      </label>

      {showBlock && blocked && (
        <p role="alert" className="text-micro">
          {blocked}
        </p>
      )}

      <div className="flex justify-end gap-1.5">
        <Button onClick={onCancel}>Cancel escalation</Button>
        <Button type="submit" variant="primary" aria-disabled={blocked ? true : undefined}>
          Escalate to {teamLabel(team)}
        </Button>
      </div>
    </form>
  );
}
