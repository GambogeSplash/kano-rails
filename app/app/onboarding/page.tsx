"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { WalletButton } from "@/components/WalletButton";
import { useReputation } from "@/lib/use-reputation";
import { buildMintReputationTx, isChainWired } from "@/lib/sui";
import { truncate } from "@/lib/utils";

type Ramp = "imports" | "vouch" | "amnesty" | null;
type MintState =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "success"; digest: string }
  | { kind: "error"; message: string };

const EASE = [0.22, 1, 0.36, 1] as const;
const FADE = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: EASE },
};

export default function Onboarding() {
  const [ramp, setRamp] = useState<Ramp>(null);
  const [imports, setImports] = useState({
    linkedin: false,
    github: false,
    evm: false,
  });
  const [vouchCode, setVouchCode] = useState("");
  const [mint, setMint] = useState<MintState>({ kind: "idle" });

  const router = useRouter();
  const account = useCurrentAccount();
  const { reputation } = useReputation();
  const chainWired = isChainWired();

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const importCount = Object.values(imports).filter(Boolean).length;
  const qualifiesViaImports = importCount >= 3;
  const qualifiesViaVouch = vouchCode.length >= 6;
  const startTier =
    qualifiesViaImports || qualifiesViaVouch || ramp === "amnesty"
      ? "Silver"
      : "Bronze";

  const doMint = () => {
    if (!account) return;
    setMint({ kind: "signing" });
    const tx = buildMintReputationTx();
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          setMint({ kind: "success", digest: result.digest });
          setTimeout(() => router.push("/app"), 2200);
        },
        onError: (err) => {
          setMint({ kind: "error", message: err.message ?? "Sign failed" });
        },
      },
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-medium">Welcome to Kano Rails</h1>
        <p className="text-muted mt-2 max-w-md mx-auto">
          New here? Don&apos;t start at the bottom. Pick a cold-start ramp so
          your first payment lands at Silver terms.
        </p>
      </div>

      <Card>
        <CardLabel>Your starting tier</CardLabel>
        <div className="mt-2 flex items-center gap-3">
          <TierBadge tier={startTier} size="lg" />
          <span className="text-sm text-muted">
            {startTier === "Silver"
              ? "0.8% fee · priority offramp · sponsored gas"
              : "1.5% fee · standard offramp · client pays gas"}
          </span>
        </div>
      </Card>

      <div className="space-y-4">
        <RampOption
          active={ramp === "imports"}
          onClick={() => setRamp("imports")}
          title="Import attestations"
          subtitle="Connect LinkedIn, GitHub, or a prior EVM wallet. Three imports = Silver."
        >
          {ramp === "imports" && (
            <div className="space-y-2">
              <ImportRow
                label="LinkedIn"
                sub="Verified work history"
                on={imports.linkedin}
                onChange={(v) => setImports({ ...imports, linkedin: v })}
              />
              <ImportRow
                label="GitHub"
                sub="Verified contributions"
                on={imports.github}
                onChange={(v) => setImports({ ...imports, github: v })}
              />
              <ImportRow
                label="Prior EVM wallet"
                sub="On-chain payment history"
                on={imports.evm}
                onChange={(v) => setImports({ ...imports, evm: v })}
              />
              <div className="text-xs text-muted font-mono pt-2">
                {importCount} / 3 —{" "}
                {qualifiesViaImports
                  ? "Silver unlocked"
                  : `need ${3 - importCount} more`}
              </div>
            </div>
          )}
        </RampOption>

        <RampOption
          active={ramp === "vouch"}
          onClick={() => setRamp("vouch")}
          title="Redeem a Gold-client vouch code"
          subtitle="A Gold-tier user can vouch for you. One vouch = Silver."
        >
          {ramp === "vouch" && (
            <input
              value={vouchCode}
              onChange={(e) => setVouchCode(e.target.value)}
              placeholder="vouch-xxxx-xxxx"
              className="w-full bg-background border border-border rounded-md px-3 py-2 font-mono text-sm focus:border-signal outline-none"
            />
          )}
        </RampOption>

        <RampOption
          active={ramp === "amnesty"}
          onClick={() => setRamp("amnesty")}
          title="First-payment amnesty"
          subtitle="Your first payment up to $1,500 settles at Silver terms. After that, you're on the standard tier path."
        />
      </div>

      <MintPanel
        chainWired={chainWired}
        connected={!!account}
        address={account?.address}
        hasReputation={!!reputation}
        startTier={startTier}
        mint={mint}
        onMint={doMint}
      />
    </div>
  );
}

// ============================================================================
// Mint panel — the bottom CTA
// ============================================================================

function MintPanel({
  chainWired,
  connected,
  address,
  hasReputation,
  startTier,
  mint,
  onMint,
}: {
  chainWired: boolean;
  connected: boolean;
  address?: string;
  hasReputation: boolean;
  startTier: "Bronze" | "Silver" | "Gold";
  mint: MintState;
  onMint: () => void;
}) {
  // 1. Chain not wired → fall back to demo route
  if (!chainWired) {
    return (
      <Link
        href="/app"
        className="block w-full text-center bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition"
      >
        Continue with {startTier} terms (demo)
      </Link>
    );
  }

  // 2. Mint success → confirmation panel + auto-redirect
  if (mint.kind === "success") {
    return (
      <Card className="border-success/40 bg-success/5 text-center py-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="size-12 mx-auto rounded-full bg-success/10 border border-success/40 flex items-center justify-center text-success"
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l5 5L20 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <div className="mt-3 font-medium">Reputation object minted</div>
        <div className="mt-1 text-xs text-muted">
          You own it on Sui. Redirecting to your dashboard…
        </div>
        <a
          href={`https://suiscan.xyz/testnet/tx/${mint.digest}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-xs font-mono text-signal hover:underline"
        >
          {mint.digest.slice(0, 10)}…{mint.digest.slice(-6)}
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
      </Card>
    );
  }

  // 3. Already minted → just route to dashboard
  if (connected && hasReputation) {
    return (
      <Card className="space-y-3">
        <div className="text-sm">
          You already have a reputation object at{" "}
          <span className="font-mono text-xs text-muted">
            {truncate(address ?? "")}
          </span>
          .
        </div>
        <Link
          href="/app"
          className="block w-full text-center bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition"
        >
          Open dashboard →
        </Link>
      </Card>
    );
  }

  // 4. Not connected → prompt to connect
  if (!connected) {
    return (
      <Card className="space-y-3 text-center">
        <div className="text-sm text-muted">
          Connect a Sui wallet to mint your reputation on testnet.
        </div>
        <div className="flex justify-center">
          <WalletButton />
        </div>
      </Card>
    );
  }

  // 5. Connected, ready to mint
  return (
    <AnimatePresence mode="wait">
      {mint.kind === "error" ? (
        <motion.div key="err" {...FADE}>
          <Card className="border-danger/40 bg-danger/5 space-y-3">
            <div className="text-sm text-danger font-medium">
              Mint failed
            </div>
            <div className="text-xs text-muted font-mono break-all">
              {mint.message}
            </div>
            <button
              onClick={onMint}
              className="w-full bg-signal text-background py-3 rounded-md font-medium"
            >
              Try again
            </button>
          </Card>
        </motion.div>
      ) : (
        <motion.button
          key="cta"
          {...FADE}
          disabled={mint.kind === "signing"}
          onClick={onMint}
          className="w-full bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition disabled:opacity-60"
        >
          {mint.kind === "signing"
            ? "Sign the transaction in your wallet…"
            : `Mint reputation on Sui · start at ${startTier}`}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Ramp option
// ============================================================================

function RampOption({
  active,
  onClick,
  title,
  subtitle,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <Card
      className={`cursor-pointer transition ${
        active ? "border-signal bg-signal-dim" : "hover:border-foreground/30"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={`size-4 mt-0.5 rounded-full border ${
            active ? "border-signal bg-signal" : "border-border"
          }`}
        />
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted mt-1">{subtitle}</div>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </Card>
  );
}

function ImportRow({
  label,
  sub,
  on,
  onChange,
}: {
  label: string;
  sub: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      className={`w-full flex items-center justify-between p-3 rounded-md border text-left transition ${
        on
          ? "border-success/40 bg-success/5"
          : "border-border hover:border-foreground/30"
      }`}
    >
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted">{sub}</div>
      </div>
      <div className="text-xs font-mono">
        {on ? "✓ imported" : "connect"}
      </div>
    </button>
  );
}
