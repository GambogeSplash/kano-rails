"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { fetchReputation, isChainWired } from "@/lib/sui";

/**
 * Returns the connected wallet's on-chain reputation, or null if there's no
 * wallet connected / chain isn't wired / the user hasn't minted one yet.
 *
 * Always fall back to mock data in the UI if `data` is null.
 */
export function useReputation() {
  const account = useCurrentAccount();
  const client = useSuiClient();

  const query = useQuery({
    queryKey: ["kano-reputation", account?.address ?? "none"],
    queryFn: async () => {
      if (!account?.address) return null;
      return fetchReputation(client as never, account.address);
    },
    enabled: !!account?.address && isChainWired(),
    staleTime: 15_000,
  });

  return {
    address: account?.address,
    chainWired: isChainWired(),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    reputation: query.data ?? null,
  };
}
