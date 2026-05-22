import { Transaction } from "@mysten/sui/transactions";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

// === Config ===

export const KANO_PACKAGE_ID =
  process.env.NEXT_PUBLIC_KANO_PACKAGE_ID ?? "";

export const USDC_TYPE =
  process.env.NEXT_PUBLIC_USDC_TYPE ?? "0x0::usdc::USDC";

export const TEST_USDC_PACKAGE_ID =
  process.env.NEXT_PUBLIC_TEST_USDC_PACKAGE_ID ?? "";

export const TEST_USDC_FAUCET =
  process.env.NEXT_PUBLIC_TEST_USDC_FAUCET ?? "";

export const SUI_CLOCK = "0x6";

export const isChainWired = () => KANO_PACKAGE_ID.length > 0;
export const isUsdcFaucetWired = () =>
  TEST_USDC_PACKAGE_ID.length > 0 && TEST_USDC_FAUCET.length > 0;

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

export interface OnChainPayment {
  objectId: string;
  receiver: string;
  sender: string | null;
  amountUsdcCents: number;
  tierAtCreation: OnChainTier;
  feeBps: number;
  gasSponsored: boolean;
  status: "pending" | "settled" | "disputed" | "expired" | "cancelled";
  attestationGiven: boolean;
}

// === Reads ===

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

export async function fetchPayment(
  client: SuiJsonRpcClient,
  paymentObjectId: string,
): Promise<OnChainPayment | null> {
  if (!isChainWired()) return null;

  const obj = await client.getObject({
    id: paymentObjectId,
    options: { showContent: true },
  });

  if (
    !obj.data?.content ||
    obj.data.content.dataType !== "moveObject" ||
    !obj.data.content.type.startsWith(`${KANO_PACKAGE_ID}::payment::PaymentObject`)
  ) {
    return null;
  }

  const fields = (obj.data.content as { fields: Record<string, unknown> })
    .fields;
  const statusNum = Number(fields.status ?? 0);
  const statusMap: OnChainPayment["status"][] = [
    "pending",
    "settled",
    "disputed",
    "expired",
    "cancelled",
  ];

  return {
    objectId: obj.data.objectId,
    receiver: String(fields.receiver ?? ""),
    sender:
      fields.sender && String(fields.sender) !== "0x0"
        ? String(fields.sender)
        : null,
    amountUsdcCents: Number(fields.amount_usdc_cents ?? 0),
    tierAtCreation: Number(fields.tier_at_creation ?? 0) as OnChainTier,
    feeBps: Number(fields.fee_bps ?? 0),
    gasSponsored: Boolean(fields.gas_sponsored),
    status: statusMap[statusNum] ?? "pending",
    attestationGiven: Boolean(fields.attestation_given),
  };
}

/**
 * Return USDC coin object IDs owned by `owner` with their balances (mist).
 */
export async function fetchUsdcCoins(
  client: SuiJsonRpcClient,
  owner: string,
): Promise<Array<{ coinObjectId: string; balance: bigint }>> {
  if (!isChainWired()) return [];
  const coins = await client.getCoins({ owner, coinType: USDC_TYPE });
  return coins.data.map((c) => ({
    coinObjectId: c.coinObjectId,
    balance: BigInt(c.balance),
  }));
}

// === Writes (Programmable Transaction builders) ===

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
 * Build a Pay tx that splits the exact required amount from a USDC coin
 * the client owns. The split coin is passed to payment::pay.
 */
export function buildPayTx(opts: {
  paymentObjectId: string;
  receiverReputationObjectId: string;
  sourceUsdcCoinId: string;
  amountUsdcCents: bigint;
}): Transaction {
  const tx = new Transaction();
  const [coinToSend] = tx.splitCoins(tx.object(opts.sourceUsdcCoinId), [
    tx.pure.u64(opts.amountUsdcCents),
  ]);
  tx.moveCall({
    target: `${KANO_PACKAGE_ID}::payment::pay`,
    typeArguments: [USDC_TYPE],
    arguments: [
      tx.object(opts.paymentObjectId),
      coinToSend,
      tx.object(opts.receiverReputationObjectId),
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
}

export function buildAttestTx(opts: {
  paymentObjectId: string;
  receiverReputationObjectId: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${KANO_PACKAGE_ID}::payment::attest`,
    typeArguments: [USDC_TYPE],
    arguments: [
      tx.object(opts.paymentObjectId),
      tx.object(opts.receiverReputationObjectId),
      tx.object(SUI_CLOCK),
    ],
  });
  return tx;
}

/**
 * Build a tx that drips 1,000 test USDC to the sender from the public faucet.
 */
export function buildDripUsdcTx(): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${TEST_USDC_PACKAGE_ID}::usdc::drip`,
    arguments: [tx.object(TEST_USDC_FAUCET)],
  });
  return tx;
}

// === Helpers ===

/**
 * Find the PaymentObject's ID in a tx response's effects.
 */
export function extractCreatedPaymentObjectId(
  result: { effects?: { created?: Array<{ reference?: { objectId?: string }; owner?: unknown }> } } | undefined,
): string | null {
  const created = result?.effects?.created;
  if (!created) return null;
  // PaymentObject is shared, so look for an entry with owner type 'Shared'.
  for (const c of created) {
    if (typeof c.owner === "object" && c.owner !== null && "Shared" in c.owner) {
      return c.reference?.objectId ?? null;
    }
  }
  // Fallback: first created object.
  return created[0]?.reference?.objectId ?? null;
}
