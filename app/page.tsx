import Link from "next/link";

// Replaced by app/(desk)/page.tsx in delivery step 2. Step 1 is the token page; nothing else is
// built until it passes.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-3 px-6">
      <p className="text-micro text-muted-foreground">Care Desk · concept</p>
      <h1 className="text-heading">The inbox arrives in delivery step 2.</h1>
      <p className="text-body text-muted-foreground">
        Step 1 is the token page: every colour role in both themes with measured contrast, the glass
        material over the wallpaper, and the type scale.
      </p>
      <Link href="/tokens" className="self-start text-label underline underline-offset-4">
        Open the token page
      </Link>
    </main>
  );
}
