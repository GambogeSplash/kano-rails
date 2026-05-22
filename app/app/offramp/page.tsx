"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { CHIDERA, TIER_CONFIG } from "@/lib/mock-data";
import { formatNGN, formatUSD } from "@/lib/utils";

interface YellowCardRate {
  rate: number;
  buy: number;
  sell: number;
  spread_pct: number;
  fetched_at: string;
}

export default function Offramp() {
  const [amount, setAmount] = useState("2976");
  const [confirmed, setConfirmed] = useState(false);
  const [rate, setRate] = useState<YellowCardRate | null>(null);
  const [rateLoading, setRateLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchRate = async () => {
      try {
        const res = await fetch("/api/yellow-card", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setRate(data);
          setRateLoading(false);
        }
      } catch {
        if (!cancelled) setRateLoading(false);
      }
    };
    fetchRate();
    const interval = setInterval(fetchRate, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const tier = TIER_CONFIG[CHIDERA.tier];
  const usdc = parseFloat(amount) || 0;
  const ngnPerUsdc = rate?.buy ?? 1620;
  const ngn = usdc * ngnPerUsdc;
  const offrampFeePct = 0.5;
  const offrampFee = ngn * (offrampFeePct / 100);
  const nairaToBank = ngn - offrampFee;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/app"
          className="text-xs text-muted hover:text-foreground font-mono"
        >
          ← dashboard
        </Link>
        <h1 className="text-3xl font-medium mt-2">Withdraw to bank</h1>
        <p className="text-muted mt-1">
          USDC → NGN via Yellow Card. Tier determines queue priority.
        </p>
      </div>

      <Card className="border-warn/40 bg-warn/5 flex items-center gap-3 text-sm">
        <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-warn/15 text-warn shrink-0">
          Demo
        </span>
        <span className="text-muted">
          Yellow Card / Busha integration is scaffolded but not live. Real
          settlement requires a business account + KYC + bank verification —
          off-platform partner work, not code.
        </span>
      </Card>

      <Card className="space-y-5">
        <label className="block">
          <CardLabel>Amount (USDC)</CardLabel>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 w-full bg-background border border-border rounded-md px-4 py-3 text-2xl font-medium tabular-nums focus:border-signal outline-none"
          />
          <div className="mt-2 text-xs text-muted font-mono">
            available: {formatUSD(2976_00)}
          </div>
        </label>

        <div>
          <CardLabel>Destination</CardLabel>
          <div className="mt-2 bg-background border border-border rounded-md px-4 py-3 text-sm">
            <div className="font-medium">GTBank · Chidera O.</div>
            <div className="font-mono text-xs text-muted mt-0.5">
              0123456789
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 font-mono text-sm">
        <div className="flex items-start justify-between">
          <CardLabel>Conversion</CardLabel>
          <div className="text-xs text-muted flex items-center gap-2">
            <span
              className={`size-1.5 rounded-full ${
                rateLoading ? "bg-warn animate-pulse" : "bg-success"
              }`}
            />
            <span>
              {rateLoading
                ? "fetching rate…"
                : `1 USDC = ₦${ngnPerUsdc.toFixed(2)} · spread ${rate?.spread_pct.toFixed(2)}%`}
            </span>
          </div>
        </div>
        <Row label="Gross" value={formatNGN(ngn)} />
        <Row label="Yellow Card fee" value={`− ${formatNGN(offrampFee)}`} muted />
        <hr className="border-border" />
        <Row label="To bank" value={formatNGN(nairaToBank)} emphasis />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardLabel>Your queue</CardLabel>
            <div className="mt-2 flex items-center gap-2">
              <TierBadge tier={CHIDERA.tier} />
              <span className="text-sm">
                {tier.offrampPriority} lane
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted font-mono uppercase tracking-wider">
              Estimated arrival
            </div>
            <div className="text-2xl font-medium tabular-nums mt-1">
              {tier.offrampEtaMinutes} min
            </div>
          </div>
        </div>
      </Card>

      {confirmed ? (
        <Card className="border-success/40 bg-success/5 text-center py-8">
          <div className="size-12 mx-auto rounded-full bg-success/10 border border-success/40 flex items-center justify-center text-success text-xl">
            ✓
          </div>
          <div className="mt-3 font-medium">Withdrawal queued</div>
          <div className="mt-1 text-xs text-muted font-mono">
            Expected at your bank in {tier.offrampEtaMinutes} minutes
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setConfirmed(true)}
          className="w-full bg-signal text-background py-3 rounded-md font-medium"
        >
          Confirm withdrawal
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
