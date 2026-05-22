"use client";

import { use, useState } from "react";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { CHIDERA, TIER_CONFIG } from "@/lib/mock-data";
import { formatUSD, truncate } from "@/lib/utils";

type PayMethod = "sui-wallet" | "cross-chain" | "zklogin-card";

export default function PaymentLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [paid, setPaid] = useState(false);

  const amount = 3000_00;
  const tier = TIER_CONFIG[CHIDERA.tier];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-xs text-muted font-mono">
            kano rails · payment object {id}
          </div>
        </div>

        <Card className="space-y-6">
          <div className="text-center">
            <CardLabel>You're paying</CardLabel>
            <div className="mt-2 text-4xl font-medium tabular-nums">
              {formatUSD(amount)}
            </div>
            <div className="mt-1 text-xs text-muted font-mono">
              USDC on Sui
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {CHIDERA.displayName}
                </div>
                <div className="text-xs text-muted font-mono">
                  {truncate(CHIDERA.address)}
                </div>
              </div>
              <TierBadge tier={CHIDERA.tier} />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center text-xs">
              <div>
                <div className="text-foreground font-medium tabular-nums">
                  {CHIDERA.completedPayments}
                </div>
                <div className="text-muted">payments</div>
              </div>
              <div>
                <div className="text-foreground font-medium tabular-nums">
                  {CHIDERA.attestationCount}
                </div>
                <div className="text-muted">attestations</div>
              </div>
              <div>
                <div className="text-foreground font-medium tabular-nums">
                  {CHIDERA.walletAgeDays}d
                </div>
                <div className="text-muted">wallet age</div>
              </div>
            </div>
          </div>

          {tier.clientGasSponsored && (
            <div className="text-xs text-center text-signal font-mono">
              ⚡ Kano sponsors your gas — pay zero fees
            </div>
          )}

          {paid ? (
            <div className="text-center py-6">
              <div className="size-12 mx-auto rounded-full bg-success/10 border border-success/40 flex items-center justify-center text-success text-xl">
                ✓
              </div>
              <div className="mt-3 font-medium">Payment sent</div>
              <div className="mt-1 text-xs text-muted font-mono">
                Settled in 4.2s · object 0x{Math.random().toString(16).slice(2, 10)}
              </div>
              <button className="mt-4 text-xs text-signal hover:underline">
                Confirm this was a legitimate contract payment (1 click)
              </button>
            </div>
          ) : method ? (
            <div className="space-y-3">
              {method === "sui-wallet" && (
                <div className="text-sm text-center text-muted">
                  Connecting Sui wallet…
                </div>
              )}
              {method === "cross-chain" && (
                <div className="text-sm text-center text-muted">
                  Routing USDC from Ethereum → Sui via Wormhole…
                </div>
              )}
              {method === "zklogin-card" && (
                <div className="space-y-2">
                  <div className="text-sm text-center text-muted">
                    Sui address provisioned via Google · 1.4s
                  </div>
                  <input
                    type="text"
                    placeholder="Card number"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              )}
              <button
                onClick={() => setPaid(true)}
                className="w-full bg-signal text-background py-3 rounded-md font-medium"
              >
                Pay {formatUSD(amount)}
              </button>
              <button
                onClick={() => setMethod(null)}
                className="w-full text-xs text-muted hover:text-foreground"
              >
                ← change method
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <PayButton
                label="Pay with Sui wallet"
                sub="You already have one connected"
                onClick={() => setMethod("sui-wallet")}
              />
              <PayButton
                label="Pay with USDC on Ethereum / Base"
                sub="We'll route it to Sui · one signature"
                onClick={() => setMethod("cross-chain")}
              />
              <PayButton
                label="Pay with card"
                sub="Sign in with Google · no wallet needed"
                onClick={() => setMethod("zklogin-card")}
              />
            </div>
          )}
        </Card>

        <div className="mt-4 text-center text-xs text-muted font-mono">
          powered by sui · zkLogin · sponsored transactions
        </div>
      </div>
    </div>
  );
}

function PayButton({
  label,
  sub,
  onClick,
}: {
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-border rounded-lg p-4 hover:border-signal hover:bg-signal-dim transition group"
    >
      <div className="font-medium text-sm group-hover:text-signal">{label}</div>
      <div className="text-xs text-muted mt-0.5">{sub}</div>
    </button>
  );
}
