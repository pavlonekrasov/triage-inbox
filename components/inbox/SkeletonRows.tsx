/** First-load placeholder at the exact 72px row geometry, so nothing shifts when rows arrive (brief 12). */
export function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden className="motion-safe:animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="relative flex h-18 items-center gap-3 px-3 after:absolute after:right-0 after:bottom-0 after:left-17 after:h-px after:bg-border"
        >
          <span className="size-11 shrink-0 rounded-full bg-muted" />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="flex items-center justify-between gap-6">
              {/* Varied name widths read as a list of people rather than a stripe pattern. */}
              <span className="h-3 rounded-full bg-muted" style={{ width: `${38 + ((i * 17) % 34)}%` }} />
              <span className="h-3 w-9 rounded-full bg-muted" />
            </span>
            <span className="h-3 w-4/5 rounded-full bg-muted" />
          </span>
          <span className="size-4 shrink-0 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
