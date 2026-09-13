/*
 * The prototype's send API (brief 14): 600 ms of latency, and failures on demand from the prototype
 * controls, so the failure states are real rather than drawn.
 */

export type SendFailure = "off" | "sometimes" | "always";

export const SEND_LATENCY_MS = 600;
/** Approve is optimistic: the reply commits only after this window closes (brief 9.3). */
export const UNDO_WINDOW_MS = 5000;

const FAILURE_RATE: Record<SendFailure, number> = { off: 0, sometimes: 0.05, always: 1 };

export function sendReply(failure: SendFailure, random: () => number = Math.random): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (random() < FAILURE_RATE[failure]) reject(new Error("The reply was not sent."));
      else resolve();
    }, SEND_LATENCY_MS);
  });
}
