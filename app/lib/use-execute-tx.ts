"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getEnokiClient, isEnokiWired } from "@/lib/enoki";

/**
 * Default executor: returns parsed effects + objectChanges so callers can
 * pluck created object IDs after the tx lands.
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

/**
 * Sponsored execution via Enoki: the Kano-Rails Enoki project pays gas, the
 * connected wallet only signs. Returns the tx digest + effects (we re-fetch
 * after execute since Enoki's execute returns only digest).
 *
 * Falls back to the regular signAndExecute if Enoki isn't wired.
 */
export function useSponsoredExecuteTx() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signTx } = useSignTransaction();
  const fallback = useExecuteTx();

  const sponsored = async (
    tx: Transaction,
    allowedMoveCallTargets: string[] = [],
  ) => {
    const enoki = getEnokiClient();
    if (!enoki || !account) throw new Error("Enoki or account missing");

    // 1. Build only the tx kind (no gas/sender fields).
    const kindBytes = await tx.build({
      client: client as never,
      onlyTransactionKind: true,
    });
    const kindB64 = Buffer.from(kindBytes).toString("base64");

    // 2. Ask Enoki to wrap it with sponsorship.
    const sponsoredTx = await enoki.createSponsoredTransaction({
      network: "testnet",
      transactionKindBytes: kindB64,
      sender: account.address,
      allowedMoveCallTargets,
    });

    // 3. User signs the sponsor-wrapped bytes with their wallet.
    const { signature } = await signTx({
      transaction: Transaction.from(sponsoredTx.bytes),
    });

    // 4. Enoki executes against the network, paying the gas.
    const exec = await enoki.executeSponsoredTransaction({
      digest: sponsoredTx.digest,
      signature,
    });

    return { digest: exec.digest };
  };

  return {
    sponsored,
    fallbackExecute: fallback,
    enabled: isEnokiWired() && !!account,
  };
}
