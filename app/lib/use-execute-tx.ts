"use client";

import {
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";

/**
 * Wrapper around dApp Kit's useSignAndExecuteTransaction that runs the
 * client's executeTransactionBlock with showEffects + showObjectChanges, so
 * the result includes parsed effects/objectChanges (not just rawEffects).
 */
export function useExecuteTx() {
  const client = useSuiClient();
  return useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) => {
      return await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      });
    },
  });
}
