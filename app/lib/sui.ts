import { Transaction } from "@mysten/sui/transactions";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

// === Config ===

export const KANO_PACKAGE_ID =
  process.env.NEXT_PUBLIC_KANO_PACKAGE_ID ?? "";

export const USDC_TYPE =
  process.env.NEXT_PUBLIC_USDC_TYPE ??
  // Sui testnet USDC type (placeholder — replace with real testnet USDC after publish).
  "0x0::usdc::USDC";

export const SUI_CLOCK = "0x6";

export const isChainWired = () => KANO_PACKAGE_ID.length > 0;

// === Types ===

export type OnChainTier = 0 | 1 | 2;
export const TIER_NAMES: Record<OnChainTier, "Bronze" | "Silver" | "Gold"> = {
  0: "Bronze",
  1: "Silver",
  2: "Gold",
};

export interface OnChainReputation {
  objectId: string;
  owner: string;
  completedPayments: number;
  totalVolumeUsdcCents: number;
  nativeAttestationCount: number;
  weightedAttestationScore: number;
  walletAgeDays: number;
  activeDisputes: number;
  tier: OnChainTier;
}

// === Reads ===

/**
 * Fetch the freelancer's ReputationObject. Returns null if the user hasn't
 * minted one yet, or if the chain integration isn't wired up.
 */
export async function fetchReputation(
  client: SuiJsonRpcClient,
  owner: string,
): Promise<OnChainReputation | null> {
  if (!isChainWired()) return null;

  const type = `${KANO_PACKAGE_ID}::reputation::ReputationObject`;
  const owned = await client.getOwnedObjects({
    owner,
    filter: { StructType: type },
    options: { showContent: true },
  });

  const first = owned.data[0];
  if (!first?.data?.content || first.data.content.dataType !== "moveObject") {
    return null;
  }

  const fields = (first.data.content as { fields: Record<string, unknown> })
    .fields;

  return {
    objectId: first.data.objectId,
    owner: String(fields.owner ?? owner),
    completedPayments: Number(fields.completed_payments ?? 0),
    totalVolumeUsdcCents: Number(fields.total_volume_usdc_cents ?? 0),
    nativeAttestationCount: Number(fields.native_attestation_count ?? 0),
    weightedAttestationScore: Number(fields.weighted_attestation_score ?? 0),
    walletAgeDays: Math.floor(
      (Date.now() - Number(fields.created_at_ms ?? Date.now())) /
        (1000 * 60 * 60 * 24),
    ),
    activeDisputes: Number(fields.active_disputes ?? 0),
    tier: Number(fields.tier ?? 0) as OnChainTier,
  };
}

// === Writes (Programmable Transaction builders) ===

/**
 * Build a tx that creates a new ReputationObject for the sender.
 */
export function buildMintReputationTx(): Transaction {
  const tx = new Transaction();
  const rep = tx.moveCall({
    target: `${KANO_PACKAGE_ID}::reputation::create`,
    arguments: [tx.object(SUI_CLOCK)],
  });
  tx.moveCall({
    target: `${KANO_PACKAGE_ID}::reputation::transfer_to_owner`,
    arguments: [rep],
  });
  return tx;
}

/**
 * Build a tx that creates a new PaymentObject. Tier snapshot is locked
 * server-side via the freelancer's ReputationObject reference.
 */
export function buildCreatePaymentTx(opts: {
  reputationObjectId: string;
  amountUsdcCents: bigint;
  deadlineMs: bigint;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${KANO_PACKAGE_ID}::payment::create`,
    typeArguments: [USDC_TYPE],
    arguments: [
      tx.object(opts.reputationObjectId),
      tx.pure.u64(opts.amountUsdcCents),
      tx.pure.u64(opts.deadlineMs),
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
}

/**
 * Build a tx that pays a PaymentObject from a USDC Coin owned by sender.
 */
export function buildPayTx(opts: {
  paymentObjectId: string;
  reputationObjectId: string;
  usdcCoinId: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${KANO_PACKAGE_ID}::payment::pay`,
    typeArguments: [USDC_TYPE],
    arguments: [
      tx.object(opts.paymentObjectId),
      tx.object(opts.usdcCoinId),
      tx.object(opts.reputationObjectId),
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
}

/**
 * Build a tx that records a native attestation from the client side.
 */
export function buildAttestTx(opts: {
  paymentObjectId: string;
  reputationObjectId: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${KANO_PACKAGE_ID}::payment::attest`,
    typeArguments: [USDC_TYPE],
    arguments: [
      tx.object(opts.paymentObjectId),
      tx.object(opts.reputationObjectId),
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
}
