"use client";

import { useState } from "react";
import { formatUSD } from "@/lib/utils";

const P2P_SPREAD_PCT = 10.4;
const TIER_FEE_PCT = { Bronze: 1.5, Silver: 0.8, Gold: 0.3 };

export function PainCalculator() {
  const [amount, setAmount] = useState(3000);
  const [tier, setTier] = useState<"Bronze" | "Silver" | "Gold">("Silver");

  const cents = amount * 100;
  const p2pLoss = Math.round(cents * (P2P_SPREAD_PCT / 100));
  const kanoFee = Math.round(cents * (TIER_FEE_PCT[tier] / 100));
  const saved = p2pLoss - kanoFee;
  const multiplier = (p2pLoss / Math.max(1, kanoFee)).toFixed(1);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted font-mono">
            See your savings
          </div>
          <div className="mt-1 text-sm text-muted">
            Drag the amount. Pick your tier.
          </div>
        </div>
        <div className="flex gap-1.5 font-mono text-xs">
          {(["Bronze", "Silver", "Gold"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`px-3 py-1.5 rounded-md border transition ${
                tier === t
                  ? "border-signal bg-signal-dim text-signal"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <input
          type="range"
          min="500"
          max="10000"
          step="100"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value))}
          className="w-full accent-signal"
        />
        <div className="mt-2 flex justify-between text-xs text-muted font-mono">
          <span>$500</span>
          <span className="text-foreground text-2xl tabular-nums">
            ${amount.toLocaleString()}
          </span>
          <span>$10,000</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-5">
          <div className="text-xs uppercase tracking-wider text-danger font-mono">
            Binance P2P today
          </div>
          <div className="mt-3 text-3xl font-medium tabular-nums">
            − {formatUSD(p2pLoss)}
          </div>
          <div className="mt-1 text-xs text-muted">
            {P2P_SPREAD_PCT}% effective loss · spread + informal fees
          </div>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/5 p-5">
          <div className="text-xs uppercase tracking-wider text-success font-mono">
            Kano Rails · {tier}
          </div>
          <div className="mt-3 text-3xl font-medium tabular-nums">
            − {formatUSD(kanoFee)}
          </div>
          <div className="mt-1 text-xs text-muted">
            {TIER_FEE_PCT[tier]}% fee · settles in seconds on Sui
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between flex-wrap gap-3 text-sm">
        <div className="text-muted">You keep</div>
        <div className="font-mono">
          <span className="text-2xl text-success tabular-nums font-medium">
            +{formatUSD(saved)}
          </span>
          <span className="ml-3 text-xs text-muted">
            {multiplier}× cheaper per payment
          </span>
        </div>
      </div>
    </div>
  );
}
