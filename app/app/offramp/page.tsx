"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { CHIDERA, TIER_CONFIG } from "@/lib/mock-data";
import { formatNGN, formatUSD, relativeTime } from "@/lib/utils";

interface YellowCardRate {
  rate: number;
  buy: number;
  sell: number;
  spread_pct: number;
  fetched_at: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

const BANKS: BankAccount[] = [
  {
    id: "gtb",
    bankName: "GTBank",
    bankCode: "058",
    accountNumber: "0123456789",
    accountName: "Chidera O.",
    verified: true,
  },
  {
    id: "kuda",
    bankName: "Kuda",
    bankCode: "090267",
    accountNumber: "0091234567",
    accountName: "Chidera O.",
    verified: true,
  },
  {
    id: "opay",
    bankName: "OPay",
    bankCode: "999992",
    accountNumber: "8167890123",
    accountName: "Chidera O.",
    verified: false,
  },
];

const RECENT_WITHDRAWALS = [
  {
    id: "wd_a1",
    amountUsdc: 2200_00,
    amountNgn: 3_564_000,
    rate: 1620,
    bank: "GTBank",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    durationMinutes: 11,
    status: "settled" as const,
  },
  {
    id: "wd_a2",
    amountUsdc: 1800_00,
    amountNgn: 2_925_000,
    rate: 1625,
    bank: "GTBank",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28),
    durationMinutes: 9,
    status: "settled" as const,
  },
  {
    id: "wd_a3",
    amountUsdc: 4500_00,
    amountNgn: 7_290_000,
    rate: 1620,
    bank: "Kuda",
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11),
    durationMinutes: 14,
    status: "settled" as const,
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const FADE = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.32, ease: EASE },
};

type Step = "amount" | "bank" | "review" | "settling" | "done";

const SETTLE_STAGES = [
  { key: "lock", label: "USDC locked in escrow" },
  { key: "convert", label: "Converting to NGN at locked rate" },
  { key: "send", label: "Pushed to bank rails" },
  { key: "arrive", label: "Settled in your account" },
] as const;

const STAGE_DURATION_MS = 1800;

export default function Offramp() {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("2976");
  const [selectedBankId, setSelectedBankId] = useState<string>(BANKS[0].id);
  const [rate, setRate] = useState<YellowCardRate | null>(null);
  const [rateAge, setRateAge] = useState(0);
  const [settleStage, setSettleStage] = useState<number>(0);
  const [confirmedRate, setConfirmedRate] = useState<number | null>(null);

  const tier = TIER_CONFIG[CHIDERA.tier];
  const selectedBank = BANKS.find((b) => b.id === selectedBankId)!;
  const usdc = parseFloat(amount) || 0;
  const ngnPerUsdc = rate?.buy ?? 1620;
  const ngn = usdc * ngnPerUsdc;
  const offrampFeePct = 0.5;
  const offrampFee = ngn * (offrampFeePct / 100);
  const nairaToBank = ngn - offrampFee;

  // Live rate polling
  useEffect(() => {
    let cancelled = false;
    const fetchRate = async () => {
      try {
        const res = await fetch("/api/yellow-card", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setRate(data);
          setRateAge(0);
        }
      } catch {
        /* ignore */
      }
    };
    fetchRate();
    const interval = setInterval(fetchRate, 8000);
    const ticker = setInterval(() => setRateAge((s) => s + 1), 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(ticker);
    };
  }, []);

  // Settling animation
  useEffect(() => {
    if (step !== "settling") return;
    if (settleStage >= SETTLE_STAGES.length) {
      const t = setTimeout(() => setStep("done"), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setSettleStage((s) => s + 1),
      STAGE_DURATION_MS,
    );
    return () => clearTimeout(t);
  }, [step, settleStage]);

  const reset = () => {
    setStep("amount");
    setSettleStage(0);
    setConfirmedRate(null);
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
        <h1 className="text-3xl font-medium mt-2">Withdraw to bank</h1>
        <p className="text-muted mt-1">
          USDC → NGN via Yellow Card. Tier determines queue priority.
        </p>
      </div>

      <DemoBanner />
      <StepRail step={step} />

      <AnimatePresence mode="wait">
        {step === "amount" && (
          <motion.div key="amount" {...FADE} className="space-y-6">
            <Card className="space-y-5">
              <label className="block">
                <CardLabel>Amount (USDC)</CardLabel>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full bg-background border border-border rounded-md px-4 py-3 text-2xl font-medium tabular-nums focus:border-signal outline-none"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted font-mono">
                  <span>available: {formatUSD(2976_00)}</span>
                  <button
                    onClick={() => setAmount("2976")}
                    className="text-signal hover:underline"
                  >
                    Max
                  </button>
                </div>
              </label>
              <QuickAmounts onPick={(v) => setAmount(v)} />
            </Card>

            <Card className="space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between">
                <CardLabel>Live rate</CardLabel>
                <RatePill rate={ngnPerUsdc} ageSec={rateAge} />
              </div>
              <Row label="Estimated NGN" value={formatNGN(ngn)} />
              <Row
                label="Yellow Card fee"
                value={`− ${formatNGN(offrampFee)}`}
                muted
              />
              <hr className="border-border" />
              <Row label="To bank (est.)" value={formatNGN(nairaToBank)} emphasis />
            </Card>

            <button
              onClick={() => setStep("bank")}
              disabled={usdc <= 0 || usdc > 2976}
              className="w-full bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              Continue
            </button>
          </motion.div>
        )}

        {step === "bank" && (
          <motion.div key="bank" {...FADE} className="space-y-3">
            <Card>
              <CardLabel>Destination bank</CardLabel>
              <div className="mt-3 space-y-2">
                {BANKS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBankId(b.id)}
                    className={`w-full text-left p-4 rounded-lg border transition ${
                      selectedBankId === b.id
                        ? "border-signal bg-signal-dim"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{b.bankName}</div>
                        <div className="text-xs text-muted font-mono mt-0.5">
                          {b.accountNumber} · {b.accountName}
                        </div>
                      </div>
                      {b.verified ? (
                        <span className="text-[10px] text-success font-mono px-2 py-0.5 rounded-full bg-success/10 border border-success/30">
                          ✓ verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-warn font-mono px-2 py-0.5 rounded-full bg-warn/10 border border-warn/30">
                          pending KYC
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                <button className="w-full text-left p-3 rounded-lg border border-dashed border-border text-sm text-muted hover:text-foreground hover:border-foreground/30 transition">
                  + Add bank account
                </button>
              </div>
            </Card>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("amount")}
                className="px-4 py-3 rounded-md border border-border text-sm text-muted hover:text-foreground"
              >
                ← back
              </button>
              <button
                onClick={() => setStep("review")}
                disabled={!selectedBank.verified}
                className="flex-1 bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {selectedBank.verified
                  ? "Review withdrawal"
                  : "Complete KYC to use this bank"}
              </button>
            </div>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div key="review" {...FADE} className="space-y-4">
            <Card className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <CardLabel>Conversion</CardLabel>
                <RatePill rate={ngnPerUsdc} ageSec={rateAge} compact />
              </div>
              <Row label="You send" value={`${formatUSD(usdc * 100)} USDC`} />
              <Row
                label="Rate (locked at confirm)"
                value={`1 USDC = ₦${ngnPerUsdc.toFixed(2)}`}
              />
              <Row label="Gross NGN" value={formatNGN(ngn)} />
              <Row label="Yellow Card fee (0.5%)" value={`− ${formatNGN(offrampFee)}`} muted />
              <hr className="border-border" />
              <Row label="To your bank" value={formatNGN(nairaToBank)} emphasis />
            </Card>

            <Card>
              <CardLabel>Destination</CardLabel>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">
                    {selectedBank.bankName}
                  </div>
                  <div className="text-xs text-muted font-mono">
                    {selectedBank.accountNumber} · {selectedBank.accountName}
                  </div>
                </div>
                <span className="text-[10px] text-success font-mono px-2 py-0.5 rounded-full bg-success/10 border border-success/30">
                  ✓ verified
                </span>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <CardLabel>Your queue</CardLabel>
                  <div className="mt-2 flex items-center gap-2">
                    <TierBadge tier={CHIDERA.tier} />
                    <span className="text-sm">{tier.offrampPriority} lane</span>
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

            <div className="flex gap-2">
              <button
                onClick={() => setStep("bank")}
                className="px-4 py-3 rounded-md border border-border text-sm text-muted hover:text-foreground"
              >
                ← back
              </button>
              <button
                onClick={() => {
                  setConfirmedRate(ngnPerUsdc);
                  setStep("settling");
                }}
                className="flex-1 bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition"
              >
                Confirm — lock rate & send
              </button>
            </div>
          </motion.div>
        )}

        {step === "settling" && (
          <motion.div key="settling" {...FADE}>
            <SettlingPanel
              currentStage={settleStage}
              amountUsdc={usdc}
              amountNgn={nairaToBank}
              bankName={selectedBank.bankName}
              lockedRate={confirmedRate ?? ngnPerUsdc}
            />
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done" {...FADE}>
            <Card className="border-success/40 bg-success/5 text-center py-8 space-y-3">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="size-14 mx-auto rounded-full bg-success/10 border border-success/40 flex items-center justify-center text-success"
              >
                <svg className="size-7" viewBox="0 0 24 24" fill="none">
                  <motion.path
                    d="M5 12l5 5L20 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
                  />
                </svg>
              </motion.div>
              <div className="text-lg font-medium">Settled</div>
              <div className="text-sm text-muted">
                {formatNGN(nairaToBank)} landed in your {selectedBank.bankName}{" "}
                account.
              </div>
              <div className="text-[10px] text-muted font-mono">
                receipt YC-{Math.random().toString(36).slice(2, 8).toUpperCase()} · {tier.offrampEtaMinutes.split("–")[0]} min total
              </div>
              <button
                onClick={reset}
                className="text-xs text-muted hover:text-foreground"
              >
                send another
              </button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {step === "amount" && <RecentWithdrawals />}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function DemoBanner() {
  return (
    <Card className="border-warn/40 bg-warn/5 flex items-center gap-3 text-sm">
      <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-warn/15 text-warn shrink-0">
        Demo
      </span>
      <span className="text-muted">
        Yellow Card / Busha integration is scaffolded but not live. Real
        settlement requires a business account + KYC + bank verification —
        off-platform partner work.
      </span>
    </Card>
  );
}

function StepRail({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "amount", label: "Amount" },
    { key: "bank", label: "Destination" },
    { key: "review", label: "Review" },
    { key: "settling", label: "Settling" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <span
              className={`flex items-center gap-1 ${
                done
                  ? "text-success"
                  : active
                    ? "text-signal"
                    : "text-muted/50"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  done
                    ? "bg-success"
                    : active
                      ? "bg-signal animate-pulse"
                      : "bg-muted/40"
                }`}
              />
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={`h-px flex-1 ${
                  done ? "bg-success" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuickAmounts({ onPick }: { onPick: (v: string) => void }) {
  const presets = ["500", "1000", "2500", "2976"];
  return (
    <div className="flex gap-2">
      {presets.map((p) => (
        <button
          key={p}
          onClick={() => onPick(p)}
          className="flex-1 px-3 py-1.5 rounded-md border border-border text-xs font-mono text-muted hover:text-foreground hover:border-foreground/30 transition"
        >
          ${p}
        </button>
      ))}
    </div>
  );
}

function RatePill({
  rate,
  ageSec,
  compact,
}: {
  rate: number;
  ageSec: number;
  compact?: boolean;
}) {
  const stale = ageSec > 6;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`size-1.5 rounded-full ${
          stale ? "bg-warn animate-pulse" : "bg-success"
        }`}
      />
      <span className="text-muted">
        {compact ? "" : "1 USDC = "}₦{rate.toFixed(2)}
      </span>
      {!compact && <span className="text-muted/60">· {ageSec}s ago</span>}
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

function SettlingPanel({
  currentStage,
  amountUsdc,
  amountNgn,
  bankName,
  lockedRate,
}: {
  currentStage: number;
  amountUsdc: number;
  amountNgn: number;
  bankName: string;
  lockedRate: number;
}) {
  return (
    <Card className="space-y-4">
      <div className="text-center">
        <CardLabel>Settling</CardLabel>
        <div className="mt-2 text-2xl font-medium tabular-nums">
          {formatUSD(amountUsdc * 100)} → {formatNGN(amountNgn)}
        </div>
        <div className="mt-1 text-xs text-muted font-mono">
          rate locked at ₦{lockedRate.toFixed(2)} · {bankName}
        </div>
      </div>

      <div className="space-y-2">
        {SETTLE_STAGES.map((s, i) => {
          const done = currentStage > i;
          const active = currentStage === i;
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: done || active ? 1 : 0.4 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center justify-between p-3 rounded-md border ${
                done
                  ? "border-success/30 bg-success/5"
                  : active
                    ? "border-signal/40 bg-signal-dim"
                    : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`size-2 rounded-full ${
                    done
                      ? "bg-success"
                      : active
                        ? "bg-signal animate-pulse"
                        : "bg-muted/40"
                  }`}
                />
                <span
                  className={`text-sm ${
                    done
                      ? "text-success"
                      : active
                        ? "text-foreground"
                        : "text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {done && (
                <span className="text-[10px] font-mono text-success">
                  ✓
                </span>
              )}
              {active && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="size-1 rounded-full bg-signal"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{
                        duration: 1.0,
                        repeat: Infinity,
                        delay: d * 0.15,
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

function RecentWithdrawals() {
  return (
    <section>
      <h2 className="text-sm font-medium mb-2 text-muted">
        Recent withdrawals
      </h2>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted font-mono uppercase tracking-wider">
            <tr className="border-b border-border">
              <th className="text-left p-3 font-normal">Bank</th>
              <th className="text-right p-3 font-normal">USDC</th>
              <th className="text-right p-3 font-normal">NGN</th>
              <th className="text-right p-3 font-normal">Time</th>
              <th className="text-right p-3 font-normal">When</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_WITHDRAWALS.map((w) => (
              <tr
                key={w.id}
                className="border-b border-border last:border-0 hover:bg-surface-2"
              >
                <td className="p-3 text-xs font-mono">{w.bank}</td>
                <td className="p-3 text-right tabular-nums">
                  {formatUSD(w.amountUsdc)}
                </td>
                <td className="p-3 text-right tabular-nums text-muted">
                  {formatNGN(w.amountNgn)}
                </td>
                <td className="p-3 text-right text-xs text-muted font-mono">
                  {w.durationMinutes} min
                </td>
                <td className="p-3 text-right text-xs text-muted font-mono">
                  {relativeTime(w.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
