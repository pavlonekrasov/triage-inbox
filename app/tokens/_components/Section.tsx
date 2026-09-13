import type { ReactNode } from "react";

export function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="text-title">
          {title}
        </h2>
        <p className="max-w-prose text-body-s text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}
