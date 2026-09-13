"use client";

import { useDesk } from "@/components/desk/desk-store";
import { TICKETS_BY_ID } from "@/data/tickets";

/** Stands in for the thread until delivery step 3, and shows which conversation the list opened. */
export function ThreadPlaceholder() {
  const { state } = useDesk();
  const ticket = state.openId ? TICKETS_BY_ID.get(state.openId) : undefined;

  return (
    <main
      aria-label="Conversation"
      className="wallpaper flex h-full min-w-0 flex-col items-center justify-center gap-1 p-8 text-center"
    >
      {ticket ? (
        <>
          <p className="max-w-md text-title break-words">{ticket.customer.name}</p>
          <p className="max-w-sm text-body-s">The thread for this conversation is built in delivery step 3.</p>
        </>
      ) : (
        <p className="text-body-s">No conversation open.</p>
      )}
    </main>
  );
}
