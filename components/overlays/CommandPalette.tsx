"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Command } from "cmdk";
import { Activity, Inbox, Keyboard, Moon, PanelRight, Pencil, Search, Sun, Undo2, UsersRound, type LucideIcon } from "lucide-react";
import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { Keys } from "@/components/controls/KeyHint";
import { contextFor, isContextOpen, laneRows, latestUndoable, useDesk } from "@/components/desk/desk-store";
import { formatPercent, TODAY } from "@/data/metrics";
import { TICKETS_BY_ID } from "@/data/tickets";
import { avatarStyle, initials } from "@/lib/avatar";
import { decisionFor } from "@/lib/decision";
import { escalationDefaults, TEAMS } from "@/lib/escalation";
import { LANES } from "@/lib/lanes";
import { applyTheme, currentTheme, subscribeTheme, type Theme } from "@/lib/theme";
import { readDemoNow } from "@/lib/use-demo-now";
import { useWideDesk } from "@/lib/use-wide-desk";
import { cn } from "@/lib/utils";
import { PRIMARY_ICON } from "@/components/thread/DecisionBar";
import { BACKDROP, POPUP } from "./overlay-classes";

const ITEM =
  "flex min-h-10 max-md:min-h-11 cursor-default items-center gap-3 rounded-input px-2.5 py-1.5 text-body-s outline-none select-none data-[selected=true]:bg-accent";

const serverTheme = (): Theme => "day";

/**
 * ⌘K or Ctrl K (brief 9.2): go to any conversation or lane, act on the open conversation (its decision,
 * Edit, Escalate to a named team, customer details), undo the last send, switch theme, and open the
 * shortcut sheet. Every command shows its key, so the palette also teaches the keymap. The palette
 * closes first and the command runs once it has, so focus lands where the command puts it.
 */
export function CommandPalette() {
  const { state, dispatch } = useDesk();
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef<(() => void) | null>(null);
  const wide = useWideDesk();
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);
  const open = state.overlay === "palette";

  const run = (command: () => void) => {
    pending.current = command;
    dispatch({ type: "setOverlay", overlay: null });
  };

  const ticket = state.openId ? TICKETS_BY_ID.get(state.openId) : undefined;
  const decision = ticket ? decisionFor(ticket, contextFor(state, ticket.id)) : null;
  const escalation = ticket ? escalationDefaults(ticket) : null;
  const teams = escalation ? [...TEAMS].sort((a, b) => Number(b.id === escalation.team) - Number(a.id === escalation.team)) : TEAMS;
  const detailsOpen = isContextOpen(state, wide);
  const undoable = latestUndoable(state.outbox);
  const batchSize = undoable?.batch == null ? 0 : Object.values(state.outbox).filter((o) => o.batch === undoable.batch).length;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) dispatch({ type: "setOverlay", overlay: null });
      }}
      onOpenChangeComplete={(next) => {
        if (next || !pending.current) return;
        const command = pending.current;
        pending.current = null;
        command();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={BACKDROP} />
        <Dialog.Popup
          initialFocus={input}
          data-command-palette
          className={cn(
            POPUP,
            "fixed top-[14dvh] left-1/2 w-[min(36rem,calc(100vw-2rem))] origin-top -translate-x-1/2 overflow-hidden",
          )}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          {/* cmdk's vim bindings claim Ctrl K for "move up" and cancel the key, so Ctrl K could open the palette but never close it. */}
          <Command label="Commands and conversations" loop vimBindings={false}>
            <div className="flex items-center gap-2.5 border-b border-border pr-3 pl-3.5">
              <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <Command.Input
                ref={input}
                placeholder="Type a command or a customer's name"
                className="h-12 min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground"
              />
              <Keys caps={["Esc"]} />
            </div>

            <Command.List className="max-h-[min(26rem,60dvh)] scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5">
              <Command.Empty className="px-3 py-8 text-center text-body-s text-muted-foreground">
                Nothing matches. Try a customer&rsquo;s name, or a command such as &ldquo;escalate&rdquo;.
              </Command.Empty>

              {ticket && decision && escalation && (
                <Group heading={`Conversation with ${ticket.customer.name}`}>
                  {decision.primary.kind !== "drafting" && (
                    <Item
                      icon={PRIMARY_ICON[decision.primary.kind]}
                      label={decision.primary.label}
                      keywords={["decide", "approve", "send"]}
                      caps={decision.primary.kind === "approve" ? ["A"] : undefined}
                      onSelect={() => run(() => dispatch({ type: "decide", now: readDemoNow(), wall: Date.now() }))}
                    />
                  )}
                  <Item icon={Pencil} label="Edit draft" keywords={["edit", "composer"]} caps={["E"]} onSelect={() => run(() => dispatch({ type: "openComposer" }))} />
                  {teams.map((team) => (
                    <Item
                      key={team.id}
                      icon={UsersRound}
                      label={`Escalate to ${team.label}`}
                      detail={team.id === escalation.suggestedTeam ? "Suggested by the AI" : undefined}
                      keywords={["escalate", "hand off", "team"]}
                      caps={team.id === escalation.team ? ["H"] : undefined}
                      onSelect={() => run(() => dispatch({ type: "setEscalateOpen", open: true, team: team.id }))}
                    />
                  ))}
                  <Item
                    icon={PanelRight}
                    label={detailsOpen ? "Hide customer details" : "Show customer details"}
                    keywords={["context", "panel", "billing", "subscription"]}
                    caps={["]"]}
                    onSelect={() => run(() => dispatch({ type: "setContextOpen", open: !detailsOpen }))}
                  />
                </Group>
              )}

              <Group heading="Go to">
                {LANES.map((lane, index) => (
                  <Item
                    key={lane.id}
                    icon={Inbox}
                    label={lane.label}
                    detail={`${laneRows(state, lane.id).length} conversations`}
                    keywords={["lane", "go to"]}
                    caps={[String(index + 1)]}
                    onSelect={() => run(() => dispatch({ type: "selectLane", lane: lane.id }))}
                  />
                ))}
                {LANES.flatMap((lane) =>
                  laneRows(state, lane.id).map((t) => (
                    <Command.Item
                      key={t.id}
                      value={`${t.customer.name} ${t.id}`}
                      keywords={[lane.label, t.triage.summary]}
                      data-palette-ticket={t.id}
                      onSelect={() => run(() => dispatch({ type: "reveal", id: t.id }))}
                      className={ITEM}
                    >
                      <span
                        aria-hidden
                        className="avatar-tint inline-flex size-6 shrink-0 items-center justify-center rounded-full text-micro"
                        style={avatarStyle(t.customer.id)}
                      >
                        {initials(t.customer.name).slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-label">{t.customer.name}</span>
                        <span className="block truncate text-micro text-muted-foreground">
                          {lane.label} · {t.triage.summary}
                        </span>
                      </span>
                    </Command.Item>
                  )),
                )}
              </Group>

              <Group heading="Desk">
                {undoable && (
                  <Item
                    icon={Undo2}
                    label={
                      batchSize > 0
                        ? `Undo the ${batchSize} replies just sent`
                        : `Undo the reply to ${TICKETS_BY_ID.get(undoable.ticketId)?.customer.name ?? "the customer"}`
                    }
                    keywords={["undo", "take back"]}
                    caps={["Z"]}
                    onSelect={() => run(() => dispatch({ type: "undoSend" }))}
                  />
                )}
                <Item
                  icon={theme === "day" ? Moon : Sun}
                  label={theme === "day" ? "Switch to Night shift" : "Switch to Day"}
                  keywords={["theme", "dark", "light", "night", "day"]}
                  onSelect={() => run(() => applyTheme(theme === "day" ? "night" : "day"))}
                />
                <Item
                  icon={Activity}
                  label="Open the quality view"
                  detail={`${formatPercent(TODAY.autoResolutionRate)} auto · ${formatPercent(TODAY.reopenRate)} reopened`}
                  keywords={["quality", "metrics", "auto-resolution", "reopen", "satisfaction"]}
                  onSelect={() => run(() => dispatch({ type: "setOverlay", overlay: "quality" }))}
                />
                <Item
                  icon={Keyboard}
                  label="Keyboard shortcuts"
                  keywords={["keys", "help"]}
                  caps={["?"]}
                  onSelect={() => run(() => dispatch({ type: "setOverlay", overlay: "shortcuts" }))}
                />
              </Group>
            </Command.List>
          </Command>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Group({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="py-1 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:pt-1.5 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-micro **:[[cmdk-group-heading]]:text-muted-foreground"
    >
      {children}
    </Command.Group>
  );
}

function Item({
  icon: Icon,
  label,
  detail,
  keywords,
  caps,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  detail?: string;
  keywords?: string[];
  caps?: string[];
  onSelect: () => void;
}) {
  return (
    <Command.Item value={label} keywords={keywords} onSelect={onSelect} className={ITEM}>
      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label">{label}</span>
        {detail && <span className="block truncate text-micro text-muted-foreground">{detail}</span>}
      </span>
      {caps && <Keys caps={caps} />}
    </Command.Item>
  );
}
