import { Desk } from "@/components/desk/Desk";
import { parseDeskParams } from "@/lib/desk-params";

/** A presentation of the existing thread, including all its decisions and context sheets. */
export default async function ThreadSlidePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <Desk initial={parseDeskParams(params)} presentation={params.presentation === "case" ? "case" : "thread"} />;
}
