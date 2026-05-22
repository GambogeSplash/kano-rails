"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/CountUp";

const EASE = [0.22, 1, 0.36, 1] as const;

interface SavingsHeroProps {
  savedCents: number;
  paymentCount: number;
  avgOfframpMinutes: number;
  feeBpsCurrent: number;
}

export function SavingsHero({
  savedCents,
  paymentCount,
  avgOfframpMinutes,
  feeBpsCurrent,
}: SavingsHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="rounded-2xl border border-border bg-surface p-6 md:p-8 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 90% 10%, rgba(34,211,163,0.20), transparent 50%)",
        }}
      />
      <div className="relative flex items-start justify-between flex-wrap gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted font-mono">
            Saved vs Binance P2P
          </div>
          <div className="mt-3 text-5xl font-medium tabular-nums">
            <span className="text-success">+$</span>
            <CountUp
              to={savedCents / 100}
              format={(n) =>
                Math.round(n).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })
              }
            />
          </div>
          <div className="mt-2 text-sm text-muted">
            across {paymentCount} payments · would have cost ~$
            {Math.round((savedCents * 10.4) / (feeBpsCurrent / 100) / 100)} on
            P2P
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted font-mono">
              Avg offramp
            </div>
            <div className="mt-1.5 text-2xl tabular-nums font-medium">
              <CountUp to={avgOfframpMinutes} format={(n) => Math.round(n).toString()} />
              <span className="text-base text-muted ml-1">min</span>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted font-mono">
              Current fee
            </div>
            <div className="mt-1.5 text-2xl tabular-nums font-medium">
              {(feeBpsCurrent / 100).toFixed(2)}
              <span className="text-base text-muted ml-0.5">%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
