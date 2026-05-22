"use client";

import { use, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { CHIDERA, TIER_CONFIG } from "@/lib/mock-data";
import { formatUSD, truncate } from "@/lib/utils";

type PayMethod = "sui-wallet" | "cross-chain" | "zklogin-card";

type ZkStep = "google" | "provisioning" | "card" | "submitting";

const EASE = [0.22, 1, 0.36, 1] as const;
const FADE_UP = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.32, ease: EASE },
};

export default function PaymentLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [paid, setPaid] = useState(false);
  const [zkStep, setZkStep] = useState<ZkStep>("google");
  const [provisionedAddress, setProvisionedAddress] = useState<string | null>(
    null,
  );
  const [crossChainSource, setCrossChainSource] = useState<string | null>(null);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const [txDigest] = useState(
    () => `0x${Math.random().toString(16).slice(2, 18)}`,
  );

  const amount = 3000_00;
  const tier = TIER_CONFIG[CHIDERA.tier];

  useEffect(() => {
    if (zkStep === "provisioning") {
      const t = setTimeout(() => {
        setProvisionedAddress(
          `0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`,
        );
        setZkStep("card");
      }, 1400);
      return () => clearTimeout(t);
    }
    if (zkStep === "submitting") {
      const t = setTimeout(() => setPaid(true), 1600);
      return () => clearTimeout(t);
    }
  }, [zkStep]);

  const reset = () => {
    setMethod(null);
    setZkStep("google");
    setProvisionedAddress(null);
    setCrossChainSource(null);
    setCard({ number: "", exp: "", cvc: "" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-xs text-muted font-mono">
            kano rails · payment object {id}
          </div>
        </div>

        <Card className="space-y-5 overflow-hidden">
          {/* Amount */}
          <div className="text-center">
            <CardLabel>You're paying</CardLabel>
            <div className="mt-2 text-4xl font-medium tabular-nums">
              {formatUSD(amount)}
            </div>
            <div className="mt-1 text-xs text-muted font-mono">
              USDC on Sui
            </div>
          </div>

          {/* Sponsored gas badge — promoted to top */}
          {tier.clientGasSponsored && !paid && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono py-1.5 rounded-md bg-signal-dim border border-signal/30 text-signal">
              <svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 21l9-13h-7l1-8L5 13h7l-1 8z" />
              </svg>
              Kano sponsors your gas · pay zero fees
            </div>
          )}

          {/* Recipient + reputation */}
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
              <Stat label="payments" value={CHIDERA.completedPayments} />
              <Stat label="attestations" value={CHIDERA.attestationCount} />
              <Stat
                label="wallet age"
                value={`${CHIDERA.walletAgeDays}d`}
              />
            </div>
          </div>

          {/* Body — animated state machine */}
          <AnimatePresence mode="wait">
            {paid ? (
              <SuccessPanel
                key="paid"
                txDigest={txDigest}
                onReset={reset}
              />
            ) : !method ? (
              <motion.div key="picker" {...FADE_UP} className="space-y-2">
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
                  highlight
                  onClick={() => setMethod("zklogin-card")}
                />
              </motion.div>
            ) : method === "sui-wallet" ? (
              <SuiWalletPanel
                key="sui"
                amount={amount}
                onPay={() => setPaid(true)}
                onBack={reset}
              />
            ) : method === "cross-chain" ? (
              <CrossChainPanel
                key="xchain"
                source={crossChainSource}
                onPickSource={setCrossChainSource}
                amount={amount}
                onPay={() => setPaid(true)}
                onBack={reset}
              />
            ) : (
              <ZkLoginPanel
                key="zk"
                step={zkStep}
                provisionedAddress={provisionedAddress}
                amount={amount}
                card={card}
                onCardChange={setCard}
                onGoogle={() => setZkStep("provisioning")}
                onSubmit={() => setZkStep("submitting")}
                onBack={reset}
              />
            )}
          </AnimatePresence>
        </Card>

        <div className="mt-4 text-center text-xs text-muted font-mono">
          powered by sui · zkLogin · sponsored transactions
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-foreground font-medium tabular-nums">{value}</div>
      <div className="text-muted">{label}</div>
    </div>
  );
}

function PayButton({
  label,
  sub,
  onClick,
  highlight,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left border rounded-lg p-4 transition group ${
        highlight
          ? "border-signal/40 bg-signal-dim hover:bg-signal-dim/70"
          : "border-border hover:border-foreground/40 hover:bg-surface-2"
      }`}
    >
      <div
        className={`font-medium text-sm ${
          highlight ? "text-signal" : "group-hover:text-foreground"
        }`}
      >
        {label}
      </div>
      <div className="text-xs text-muted mt-0.5">{sub}</div>
      {highlight && (
        <div className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-wider text-signal/70">
          recommended
        </div>
      )}
    </button>
  );
}

function SuiWalletPanel({
  amount,
  onPay,
  onBack,
}: {
  amount: number;
  onPay: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div {...FADE_UP} className="space-y-3">
      <div className="border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="size-8 rounded-md bg-signal-dim flex items-center justify-center text-signal">
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">Sui Wallet detected</div>
          <div className="text-xs text-muted font-mono">
            0x9a4f…b21c · 487 USDC available
          </div>
        </div>
      </div>
      <PrimaryButton onClick={onPay}>
        Sign & pay {formatUSD(amount)}
      </PrimaryButton>
      <BackButton onClick={onBack} />
    </motion.div>
  );
}

function CrossChainPanel({
  source,
  onPickSource,
  amount,
  onPay,
  onBack,
}: {
  source: string | null;
  onPickSource: (s: string) => void;
  amount: number;
  onPay: () => void;
  onBack: () => void;
}) {
  const chains = [
    { id: "ethereum", label: "Ethereum", route: "Wormhole · ~12s" },
    { id: "base", label: "Base", route: "LayerZero · ~6s" },
    { id: "arbitrum", label: "Arbitrum", route: "Wormhole · ~10s" },
  ];

  if (!source) {
    return (
      <motion.div {...FADE_UP} className="space-y-2">
        <div className="text-xs text-muted text-center mb-1">
          Source chain
        </div>
        {chains.map((c) => (
          <button
            key={c.id}
            onClick={() => onPickSource(c.id)}
            className="w-full flex items-center justify-between border border-border rounded-lg p-3 hover:border-signal/50 hover:bg-signal-dim transition text-left"
          >
            <span className="text-sm font-medium">{c.label}</span>
            <span className="text-xs font-mono text-muted">{c.route}</span>
          </button>
        ))}
        <BackButton onClick={onBack} />
      </motion.div>
    );
  }

  const chain = chains.find((c) => c.id === source)!;
  return (
    <motion.div {...FADE_UP} className="space-y-3">
      <div className="border border-border rounded-lg p-3 space-y-2 text-xs font-mono">
        <Row label="from" value={chain.label} />
        <Row label="route" value={chain.route} />
        <Row label="to" value="Sui · USDC" />
        <Row label="gas" value="sponsored" highlight />
      </div>
      <PrimaryButton onClick={onPay}>
        Approve & pay {formatUSD(amount)}
      </PrimaryButton>
      <BackButton onClick={onBack} />
    </motion.div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={highlight ? "text-signal" : "text-foreground"}>
        {value}
      </span>
    </div>
  );
}

function ZkLoginPanel({
  step,
  provisionedAddress,
  amount,
  card,
  onCardChange,
  onGoogle,
  onSubmit,
  onBack,
}: {
  step: ZkStep;
  provisionedAddress: string | null;
  amount: number;
  card: { number: string; exp: string; cvc: string };
  onCardChange: (c: { number: string; exp: string; cvc: string }) => void;
  onGoogle: () => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div {...FADE_UP} className="space-y-3">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-wider">
        <StepDot active={step === "google"} done={step !== "google"}>
          1 sign in
        </StepDot>
        <Connector done={step !== "google"} />
        <StepDot
          active={step === "provisioning" || step === "card"}
          done={step === "submitting"}
        >
          2 provision
        </StepDot>
        <Connector done={step === "submitting"} />
        <StepDot active={step === "submitting"} done={false}>
          3 pay
        </StepDot>
      </div>

      <AnimatePresence mode="wait">
        {step === "google" && (
          <motion.div key="google" {...FADE_UP} className="space-y-3">
            <button
              onClick={onGoogle}
              className="w-full flex items-center justify-center gap-3 bg-foreground text-background rounded-md py-3 font-medium text-sm hover:opacity-90 transition"
            >
              <svg className="size-4" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.5 0 10.4-2.1 14-5.5l-6.5-5.5c-2 1.4-4.6 2.3-7.5 2.3-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.5 5.5c-.5.4 7-5.1 7-15.2 0-1.3-.1-2.4-.4-3.5z"
                />
              </svg>
              Continue with Google
            </button>
            <div className="text-[11px] text-muted text-center leading-relaxed">
              We'll provision a Sui address from your Google sign-in via{" "}
              <span className="font-mono">zkLogin</span>. No wallet to install.
              No seed phrase.
            </div>
          </motion.div>
        )}

        {step === "provisioning" && (
          <motion.div
            key="prov"
            {...FADE_UP}
            className="py-4 text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 text-xs font-mono text-muted">
              <span className="size-2 rounded-full bg-signal animate-pulse" />
              chidera@gmail.com
            </div>
            <div className="text-sm text-foreground">
              Provisioning your Sui address…
            </div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-signal"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === "card" && provisionedAddress && (
          <motion.div key="card" {...FADE_UP} className="space-y-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex items-center justify-between rounded-md bg-success/5 border border-success/30 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-success" />
                <span className="text-success">Sui address provisioned</span>
              </div>
              <span className="text-muted font-mono">
                {provisionedAddress}
              </span>
            </motion.div>

            <div className="space-y-2">
              <CardLabel>Card details</CardLabel>
              <input
                inputMode="numeric"
                placeholder="1234 1234 1234 1234"
                value={card.number}
                onChange={(e) =>
                  onCardChange({ ...card, number: e.target.value })
                }
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm font-mono focus:border-signal outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  inputMode="numeric"
                  placeholder="MM / YY"
                  value={card.exp}
                  onChange={(e) =>
                    onCardChange({ ...card, exp: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm font-mono focus:border-signal outline-none"
                />
                <input
                  inputMode="numeric"
                  placeholder="CVC"
                  value={card.cvc}
                  onChange={(e) =>
                    onCardChange({ ...card, cvc: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm font-mono focus:border-signal outline-none"
                />
              </div>
            </div>

            <PrimaryButton onClick={onSubmit}>
              Pay {formatUSD(amount)}
            </PrimaryButton>
          </motion.div>
        )}

        {step === "submitting" && (
          <motion.div
            key="sub"
            {...FADE_UP}
            className="py-4 text-center space-y-3"
          >
            <div className="text-sm text-foreground">Settling on Sui…</div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-success"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * 0.12,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === "google" && <BackButton onClick={onBack} />}
    </motion.div>
  );
}

function StepDot({
  active,
  done,
  children,
}: {
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`flex items-center gap-1 ${
        done
          ? "text-success"
          : active
            ? "text-signal"
            : "text-muted/60"
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
      {children}
    </span>
  );
}

function Connector({ done }: { done: boolean }) {
  return (
    <span
      className={`h-px w-4 ${done ? "bg-success" : "bg-border"}`}
    />
  );
}

function SuccessPanel({
  txDigest,
  onReset,
}: {
  txDigest: string;
  onReset: () => void;
}) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="py-4 text-center space-y-3"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.55,
          ease: EASE,
          delay: 0.05,
        }}
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
            transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
          />
        </svg>
      </motion.div>
      <div className="font-medium text-lg">Payment sent</div>
      <div className="space-y-1.5 text-xs font-mono text-muted">
        <div>Settled in 4.2s</div>
        <a
          href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-signal hover:underline"
        >
          {txDigest.slice(0, 10)}…{txDigest.slice(-6)}
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
      <div className="pt-2">
        <button className="w-full text-xs text-signal hover:bg-signal-dim transition rounded-md py-2.5 border border-signal/30">
          Confirm this was a legitimate contract payment
        </button>
        <div className="mt-1.5 text-[10px] text-muted">
          One click. Helps {CHIDERA.displayName.split(" ")[0]} reach Gold tier.
        </div>
      </div>
      <button
        onClick={onReset}
        className="text-xs text-muted hover:text-foreground mt-2"
      >
        send another payment
      </button>
    </motion.div>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition"
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-xs text-muted hover:text-foreground py-1"
    >
      ← change method
    </button>
  );
}
