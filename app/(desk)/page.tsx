import type { Metadata } from "next";
import { Desk } from "@/components/desk/Desk";
import { parseDeskParams } from "@/lib/desk-params";

export const metadata: Metadata = { title: "Inbox" };

export default async function DeskPage({ searchParams }: PageProps<"/">) {
  return <Desk initial={parseDeskParams(await searchParams)} />;
}
