"use client";

import { useReputation } from "@/lib/use-reputation";
import { truncate } from "@/lib/utils";

export function ChainStatus() {
  const { address, chainWired, reputation, isFetching } = useReputation();

  let state: "mock" | "unwired" | "live" | "loading" | "no-rep";
  let label: string;

  if (!chainWired) {
    state = "unwired";
    label = "demo · mock data · package not published";
  } else if (!address) {
    state = "mock";
    label = "demo · mock data · connect wallet for live";
  } else if (isFetching) {
    state = "loading";
    label = `reading on-chain · ${truncate(address)}`;
  } else if (reputation) {
    state = "live";
    label = `live · ${truncate(address)}`;
  } else {
    state = "no-rep";
    label = `connected · no reputation object yet · ${truncate(address)}`;
  }

  const dotColor: Record<typeof state, string> = {
    mock: "bg-muted",
    unwired: "bg-muted",
    loading: "bg-warn animate-pulse",
    live: "bg-success",
    "no-rep": "bg-warn",
  };

  return (
    <div className="inline-flex items-center gap-2 text-xs font-mono text-muted">
      <span className={`size-1.5 rounded-full ${dotColor[state]}`} />
      <span>{label}</span>
    </div>
  );
}
