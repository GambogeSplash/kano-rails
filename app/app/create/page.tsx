"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { WalletButton } from "@/components/WalletButton";
import { CHIDERA, TIER_CONFIG } from "@/lib/mock-data";
import { useReputation } from "@/lib/use-reputation";
import { useExecuteTx } from "@/lib/use-execute-tx";
import {
  buildCreatePaymentTx,
  extractCreatedPaymentObjectId,
  isChainWired,
  KANO_PACKAGE_ID,
  USDC_TYPE,
} from "@/lib/sui";
import { formatUSD } from "@/lib/utils";

type SubmitState =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "success"; paymentId: string; digest: string }
  | { kind: "error"; message: string };

export default function CreateRequest() {
  const [amount, setAmount] = useState("3000");
  const [client, setClient] = useState("berlin@startup.com");
  const [deadline, setDeadline] = useState("48");
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });

  const account = useCurrentAccount();
  const { reputation } = useReputation();
  const chainWired = isChainWired();
  const { mutate: doSignAndExecute } = useExecuteTx();

  const onChainTier = reputation
    ? reputation.tier === 2
      ? "Gold"
      : reputation.tier === 1
        ? "Silver"
        : "Bronze"
    : CHIDERA.tier;
  const tier = TIER_CONFIG[onChainTier];

  const amountCents = Math.round((parseFloat(amount) || 0) * 100);
  const feeCents = Math.round((amountCents * tier.feeBps) / 10000);
  const receiveCents = amountCents - feeCents;

  const canSubmitOnChain =
    chainWired && account && reputation && submit.kind !== "signing";

  const generate = () => {
    if (!canSubmitOnChain || !reputation) {
      // Demo-only path: fake id
      const id = `pay_${Math.random().toString(36).slice(2, 6)}`;
      setSubmit({ kind: "success", paymentId: id, digest: "" });
      return;
    }

    setSubmit({ kind: "signing" });
    const tx = buildCreatePaymentTx({
      reputationObjectId: reputation.objectId,
      amountUsdcCents: BigInt(amountCents),
      deadlineMs: BigInt(Date.now() + parseInt(deadline) * 3600 * 1000),
    });

    doSignAndExecute(
      { transaction: tx },
      {
        onSuccess: async (result) => {
          const paymentId =
            extractCreatedPaymentObjectId(result as never) ?? "unknown";
          setSubmit({
            kind: "success",
            paymentId,
            digest: result.digest,
          });
        },
        onError: (err) => {
          setSubmit({
            kind: "error",
            message: err.message ?? "Sign failed",
          });
        },
      },
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/app"
          className="text-xs text-muted hover:text-foreground font-mono"
        >
          ← dashboard
        </Link>
        <h1 className="text-3xl font-medium mt-2">New payment request</h1>
        <p className="text-muted mt-1">
          Tier locks at creation. Snapshot is immutable.
        </p>
      </div>

      {chainWired && !account && (
        <Card className="border-warn/40 bg-warn/5 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm">
            Connect a wallet to create a real on-chain payment request.
          </span>
          <WalletButton />
        </Card>
      )}

      {chainWired && account && !reputation && (
        <Card className="border-warn/40 bg-warn/5 space-y-2">
          <div className="text-sm font-medium">No reputation object yet</div>
          <div className="text-xs text-muted">
            Mint one before creating a request — your tier comes from it.
          </div>
          <Link
            href="/onboarding"
            className="inline-block text-xs text-signal hover:underline"
          >
            Go to onboarding →
          </Link>
        </Card>
      )}

      <Card className="space-y-5">
        <label className="block">
          <CardLabel>Amount (USDC)</CardLabel>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 w-full bg-background border border-border rounded-md px-4 py-3 text-2xl font-medium tabular-nums focus:border-signal outline-none"
          />
        </label>

        <label className="block">
          <CardLabel>Client (email or Sui address)</CardLabel>
          <input
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="mt-2 w-full bg-background border border-border rounded-md px-4 py-3 font-mono text-sm focus:border-signal outline-none"
          />
        </label>

        <div>
          <CardLabel>Deadline</CardLabel>
          <div className="mt-2 flex gap-2">
            {["12", "24", "48", "72"].map((h) => (
              <button
                key={h}
                onClick={() => setDeadline(h)}
                className={`px-4 py-2 rounded-md text-sm font-mono border ${
                  deadline === h
                    ? "border-signal bg-signal-dim text-signal"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-signal-dim border-signal/30">
        <div className="flex items-start justify-between">
          <CardLabel>Settlement preview</CardLabel>
          <TierBadge tier={onChainTier} />
        </div>
        <div className="mt-4 space-y-2 font-mono text-sm">
          <Row label="Tier" value={onChainTier} />
          <Row label="Fee rate" value={`${(tier.feeBps / 100).toFixed(2)}%`} />
          <Row
            label="Offramp priority"
            value={`${tier.offrampPriority} (${tier.offrampEtaMinutes} min)`}
          />
          <Row
            label="Client gas"
            value={
              tier.clientGasSponsored ? "Sponsored by Kano" : "Client pays"
            }
          />
          <hr className="border-border my-3" />
          <Row label="Gross" value={formatUSD(amountCents)} />
          <Row label="Fee" value={`− ${formatUSD(feeCents)}`} muted />
          <Row label="You receive" value={formatUSD(receiveCents)} emphasis />
        </div>
      </Card>

      {submit.kind === "success" ? (
        <Card className="border-success/40 bg-success/5">
          <CardLabel>
            {submit.digest ? "Payment object created on Sui" : "Payment object created (demo)"}
          </CardLabel>
          <div className="mt-2 font-mono text-sm break-all text-success">
            {submit.paymentId}
          </div>
          {submit.digest && (
            <a
              href={`https://suiscan.xyz/testnet/tx/${submit.digest}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs font-mono text-signal hover:underline"
            >
              tx {submit.digest.slice(0, 10)}…{submit.digest.slice(-6)}
              <svg
                className="size-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M7 17L17 7M9 7h8v8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
          <div className="mt-3 text-sm">Share this link with your client:</div>
          <ShareLinkRow
            url={`https://kanorails.vercel.app/pay/${submit.paymentId}`}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/pay/${submit.paymentId}`}
              className="bg-signal text-background px-4 py-2 rounded-md text-sm font-medium"
            >
              Preview client view →
            </Link>
            <Link
              href="/app"
              className="px-4 py-2 rounded-md border border-border text-sm text-muted hover:text-foreground hover:border-foreground/30"
            >
              Back to dashboard
            </Link>
            <button
              onClick={() => setSubmit({ kind: "idle" })}
              className="px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              Create another
            </button>
          </div>
        </Card>
      ) : submit.kind === "error" ? (
        <Card className="border-danger/40 bg-danger/5 space-y-3">
          <div className="text-sm text-danger font-medium">Sign failed</div>
          <div className="text-xs text-muted font-mono break-all">
            {submit.message}
          </div>
          <button
            onClick={generate}
            className="w-full bg-signal text-background py-3 rounded-md font-medium"
          >
            Try again
          </button>
        </Card>
      ) : (
        <button
          onClick={generate}
          disabled={submit.kind === "signing"}
          className="w-full bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition disabled:opacity-60"
        >
          {submit.kind === "signing"
            ? "Sign in your wallet…"
            : canSubmitOnChain
              ? "Sign & create payment object"
              : "Generate payment link (demo)"}
        </button>
      )}

      {chainWired && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer">PTB payload</summary>
          <pre className="mt-2 bg-surface border border-border rounded-md p-3 font-mono overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    target: `${KANO_PACKAGE_ID}::payment::create`,
    type_args: [USDC_TYPE],
    args: [
      { object: reputation?.objectId ?? "<your_reputation_object>" },
      { u64: String(amountCents) },
      { u64: "<deadline_ms>" },
      { object: "0x6 (clock)" },
    ],
  },
  null,
  2,
)}
          </pre>
        </details>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  emphasis,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span
        className={
          emphasis
            ? "text-foreground font-medium"
            : muted
              ? "text-muted"
              : "text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

function ShareLinkRow({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="mt-2 flex items-center gap-2 bg-background border border-border rounded-md p-1 pl-3">
      <div className="flex-1 font-mono text-xs break-all">{url}</div>
      <button
        onClick={copy}
        className="shrink-0 px-3 py-1.5 rounded-md bg-surface-2 text-xs font-mono hover:bg-surface"
      >
        {copied ? "copied ✓" : "copy"}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          "Pay me on Kano Rails — reputation-gated USDC payments on Sui · " + url,
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3 py-1.5 rounded-md bg-surface-2 text-xs font-mono hover:bg-surface"
      >
        share
      </a>
    </div>
  );
}
