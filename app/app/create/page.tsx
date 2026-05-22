"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { CHIDERA, TIER_CONFIG } from "@/lib/mock-data";
import { formatUSD } from "@/lib/utils";
import {
  buildCreatePaymentTx,
  isChainWired,
  KANO_PACKAGE_ID,
} from "@/lib/sui";

interface GenerationResult {
  id: string;
  ptbPreview: string;
  chainWired: boolean;
}

export default function CreateRequest() {
  const [amount, setAmount] = useState("3000");
  const [client, setClient] = useState("berlin@startup.com");
  const [deadline, setDeadline] = useState("48");
  const [generated, setGenerated] = useState<GenerationResult | null>(null);

  const tier = TIER_CONFIG[CHIDERA.tier];
  const amountCents = Math.round((parseFloat(amount) || 0) * 100);
  const feeCents = Math.round((amountCents * tier.feeBps) / 10000);
  const receiveCents = amountCents - feeCents;

  const generate = () => {
    const id = `pay_${Math.random().toString(36).slice(2, 6)}`;
    const deadlineMs = BigInt(Date.now() + parseInt(deadline) * 3600 * 1000);

    let ptbPreview: string;
    if (isChainWired()) {
      try {
        const tx = buildCreatePaymentTx({
          reputationObjectId: CHIDERA.address,
          amountUsdcCents: BigInt(amountCents),
          deadlineMs,
        });
        // Show the move call payload (no sender/gas set yet, no signing).
        ptbPreview = JSON.stringify(
          {
            target: `${KANO_PACKAGE_ID}::payment::create`,
            type_args: [
              process.env.NEXT_PUBLIC_USDC_TYPE ?? "0x0::usdc::USDC",
            ],
            args: [
              { object: CHIDERA.address },
              { u64: String(amountCents) },
              { u64: String(deadlineMs) },
              { object: "0x6 (clock)" },
            ],
            // Tag the SDK actually built a real Transaction object:
            sdk_constructed: tx.constructor.name === "Transaction",
          },
          null,
          2,
        );
      } catch (err) {
        ptbPreview = `// Builder error: ${String(err)}`;
      }
    } else {
      ptbPreview = JSON.stringify(
        {
          target: "<package_id>::payment::create",
          type_args: ["<usdc_type>"],
          args: [
            { object: "<reputation_object_id>" },
            { u64: String(amountCents) },
            { u64: String(deadlineMs) },
            { object: "0x6 (clock)" },
          ],
          // Will be a real PTB once NEXT_PUBLIC_KANO_PACKAGE_ID is set:
          chain_wired: false,
        },
        null,
        2,
      );
    }

    setGenerated({ id, ptbPreview, chainWired: isChainWired() });
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
          <TierBadge tier={CHIDERA.tier} />
        </div>
        <div className="mt-4 space-y-2 font-mono text-sm">
          <Row label="Tier" value={CHIDERA.tier} />
          <Row label="Fee rate" value={`${(tier.feeBps / 100).toFixed(2)}%`} />
          <Row
            label="Offramp priority"
            value={`${tier.offrampPriority} (${tier.offrampEtaMinutes} min)`}
          />
          <Row
            label="Client gas"
            value={
              tier.clientGasSponsored
                ? "Sponsored by Kano"
                : "Client pays"
            }
          />
          <hr className="border-border my-3" />
          <Row label="Gross" value={formatUSD(amountCents)} />
          <Row label="Fee" value={`− ${formatUSD(feeCents)}`} muted />
          <Row label="You receive" value={formatUSD(receiveCents)} emphasis />
        </div>
      </Card>

      {generated ? (
        <>
          <Card className="border-success/40 bg-success/5">
            <CardLabel>Payment object created</CardLabel>
            <div className="mt-2 font-mono text-sm break-all text-success">
              {generated.id}
            </div>
            <div className="mt-3 text-sm">Share this link with your client:</div>
            <div className="mt-2 bg-background border border-border rounded-md px-3 py-2 font-mono text-xs break-all">
              https://kano.rails/pay/{generated.id}
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                href={`/pay/${generated.id}`}
                className="bg-signal text-background px-4 py-2 rounded-md text-sm font-medium"
              >
                Preview client view →
              </Link>
              <button
                onClick={() => setGenerated(null)}
                className="text-sm text-muted hover:text-foreground"
              >
                Create another
              </button>
            </div>
          </Card>
          <Card>
            <div className="flex items-start justify-between">
              <CardLabel>Programmable Transaction payload</CardLabel>
              <span className="text-xs font-mono text-muted">
                {generated.chainWired
                  ? "built with @mysten/sui · ready to sign"
                  : "preview · set NEXT_PUBLIC_KANO_PACKAGE_ID for live"}
              </span>
            </div>
            <pre className="mt-3 bg-background border border-border rounded-md p-3 text-xs font-mono overflow-x-auto leading-relaxed">
              {generated.ptbPreview}
            </pre>
          </Card>
        </>
      ) : (
        <button
          onClick={generate}
          className="w-full bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition"
        >
          Generate payment link
        </button>
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
