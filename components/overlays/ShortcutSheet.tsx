"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/controls/Button";
import { Keys } from "@/components/controls/KeyHint";
import { useDesk } from "@/components/desk/desk-store";
import { KEYMAP, LOCAL_KEYS, type ShortcutGroup } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { BACKDROP, POPUP } from "./overlay-classes";

const GROUPS: { id: ShortcutGroup; title: string }[] = [
  { id: "Move", title: "Move around" },
  { id: "Decide", title: "Decide" },
  { id: "Select", title: "Select drafts" },
  { id: "Desk", title: "Desk" },
];

/**
 * The ? sheet (brief 9.2), drawn from the keymap itself, so it cannot fall out of date. ? closes it
 * again, as does Esc.
 */
export function ShortcutSheet() {
  const { state, dispatch } = useDesk();
  const open = state.overlay === "shortcuts";
  const close = () => dispatch({ type: "setOverlay", overlay: null });

  const sections = [
    ...GROUPS.map((group) => ({
      title: group.title,
      rows: KEYMAP.filter((b) => b.group === group.id).map((b) => ({ label: b.label, caps: b.caps })),
    })),
    ...(["In the list", "In selection", "In the composer"] as const).map((title) => ({
      title,
      rows: LOCAL_KEYS.filter((k) => k.group === title),
    })),
  ];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={BACKDROP} />
        <Dialog.Popup
          data-shortcut-sheet
          data-pass-shortcut="shortcuts"
          className={cn(
            POPUP,
            "fixed top-1/2 left-1/2 flex max-h-[min(42rem,calc(100dvh-2rem))] w-[min(46rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col",
          )}
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-border py-2 pr-2 pl-5">
            <Dialog.Title className="min-w-0 flex-1 text-title">Keyboard shortcuts</Dialog.Title>
            <Button iconOnly aria-label="Close keyboard shortcuts" title="Close (Esc)" onClick={close}>
              <X aria-hidden strokeWidth={1.75} />
            </Button>
          </header>
          <div className="grid gap-x-10 gap-y-5 overflow-y-auto overscroll-contain px-5 pt-4 pb-5 sm:grid-cols-2">
            {sections.map((section) => (
              <section key={section.title}>
                <h3 className="mb-2 text-label text-muted-foreground">{section.title}</h3>
                <dl className="flex flex-col gap-2">
                  {section.rows.map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-4 text-body-s">
                      <dt className="min-w-0 pt-px">{row.label}</dt>
                      <dd>
                        <Keys caps={row.caps} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
          <p className="shrink-0 border-t border-border px-5 py-3 text-micro text-muted-foreground">
            Letter keys pause while you type in a field; the palette key still works there.
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
