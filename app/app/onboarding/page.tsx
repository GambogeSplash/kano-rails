"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { WalletButton } from "@/components/WalletButton";
import { useReputation } from "@/lib/use-reputation";
import { useExecuteTx } from "@/lib/use-execute-tx";
import {
  buildMintReputationTx,
  isChainWired,
  KANO_PACKAGE_ID,
  SUI_CLOCK,
} from "@/lib/sui";
import { truncate } from "@/lib/utils";

type ImportKey = "linkedin" | "github" | "evm";
type ImportState = "off" | "on" | "signing" | "done" | "error";

type Step =
  | { kind: "idle" }
  | { kind: "minting" }
  | { kind: "minted"; digest: string }
  | { kind: "importing"; index: number }
  | { kind: "complete"; digest: string }
  | { kind: "error"; message: string };

const EASE = [0.22, 1, 0.36, 1] as const;
const FADE = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: EASE },
};

const IMPORT_META: Record<ImportKey, { label: string; source: string; placeholder: string }> = {
  linkedin: {
    label: "LinkedIn",
    source: "linkedin",
    placeholder: "linkedin.com/in/your-handle",
  },
  github: {
    label: "GitHub",
    source: "github",
    placeholder: "github.com/your-handle",
  },
  evm: {
    label: "Prior EVM wallet",
    source: "evm-wallet",
    placeholder: "0x… on Ethereum",
  },
};

export default function Onboarding() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { reputation } = useReputation();
  const chainWired = isChainWired();
  const { mutate: doSignAndExecute } = useExecuteTx();

  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [importStates, setImportStates] = useState<
    Record<ImportKey, ImportState>
  >({
    linkedin: "off",
    github: "off",
    evm: "off",
  });
  const [importInputs, setImportInputs] = useState<Record<ImportKey, string>>({
    linkedin: "",
    github: "",
    evm: "",
  });

  const queuedImports = (Object.keys(importStates) as ImportKey[]).filter(
    (k) => importStates[k] === "on" && importInputs[k].trim().length > 0,
  );

  const setImport = (k: ImportKey, state: ImportState) =>
    setImportStates((s) => ({ ...s, [k]: state }));

  const signImport = async (k: ImportKey, repObjectId: string) => {
    setImport(k, "signing");
    const tx = new Transaction();
    tx.moveCall({
      target: `${KANO_PACKAGE_ID}::reputation::add_imported_attestation`,
      arguments: [
        tx.object(repObjectId),
        tx.pure.string(IMPORT_META[k].source),
        tx.pure.string(importInputs[k]),
        tx.object(SUI_CLOCK),
      ],
    });
    return new Promise<void>((resolve) => {
      doSignAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            setImport(k, "done");
            resolve();
          },
          onError: () => {
            setImport(k, "error");
            resolve();
          },
        },
      );
    });
  };

  const doMint = () => {
    if (!account) return;
    setStep({ kind: "minting" });
    doSignAndExecute(
      { transaction: buildMintReputationTx() },
      {
        onSuccess: async (result) => {
          // Pull the freshly minted ReputationObject ID from objectChanges.
          const created = (
            result as {
              objectChanges?: Array<{
                type?: string;
                objectId?: string;
                objectType?: string;
              }>;
            }
          ).objectChanges?.find(
            (c) =>
              c.type === "created" &&
              c.objectType?.endsWith("reputation::ReputationObject"),
          );
          const repId = created?.objectId;
          setStep({ kind: "minted", digest: result.digest });

          if (queuedImports.length === 0 || !repId) {
            setStep({ kind: "complete", digest: result.digest });
            setTimeout(() => router.push("/app"), 1800);
            return;
          }

          // Sign each import sequentially
          for (let i = 0; i < queuedImports.length; i++) {
            setStep({ kind: "importing", index: i });
            await signImport(queuedImports[i], repId);
          }
          setStep({ kind: "complete", digest: result.digest });
          setTimeout(() => router.push("/app"), 2000);
        },
        onError: (err) => {
          setStep({ kind: "error", message: err.message ?? "Sign failed" });
        },
      },
    );
  };

  const busy =
    step.kind === "minting" ||
    step.kind === "minted" ||
    step.kind === "importing";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-medium">Mint your reputation</h1>
        <p className="text-muted mt-2 max-w-md mx-auto">
          Create your on-chain ReputationObject. Optionally seed it with
          self-claimed attestations from LinkedIn / GitHub / a prior wallet.
        </p>
      </div>

      <Card>
        <CardLabel>Your starting tier</CardLabel>
        <div className="mt-2 flex items-center gap-3">
          <TierBadge tier="Bronze" size="lg" />
          <span className="text-sm text-muted">
            1.5% fee · standard offramp · client pays gas
          </span>
        </div>
        <div className="mt-3 text-xs text-muted">
          Earn Silver at 3 completed payments + 1 client attestation. Earn Gold
          at 10 payments + weighted attestation score ≥ 400 + 90-day wallet.
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium">Seed your reputation</div>
            <div className="text-sm text-muted mt-1">
              Each import adds 50% weight to your attestation score. Optional.
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-mono text-muted px-2 py-0.5 rounded-full bg-surface-2">
            on-chain
          </span>
        </div>
        <div className="space-y-2">
          {(Object.keys(IMPORT_META) as ImportKey[]).map((k) => (
            <ImportRow
              key={k}
              meta={IMPORT_META[k]}
              state={importStates[k]}
              value={importInputs[k]}
              onToggle={() =>
                setImport(
                  k,
                  importStates[k] === "off" ? "on" : "off",
                )
              }
              onValueChange={(v) =>
                setImportInputs((s) => ({ ...s, [k]: v }))
              }
            />
          ))}
        </div>
        <div className="text-[11px] text-muted leading-relaxed pt-2 border-t border-border">
          <span className="text-warn font-mono">V1:</span> self-claimed —
          identifiers are accepted as-is. <span className="font-mono">V2:</span>{" "}
          cryptographic verification via SBT or oracle attestation, so an
          identifier can only be claimed by the wallet that proves ownership.
        </div>
      </Card>

      <Card className="border-border/60 bg-surface/60 space-y-2">
        <div className="flex items-center justify-between">
          <CardLabel>Cold-start ramps</CardLabel>
          <span className="text-[10px] uppercase tracking-wider font-mono text-muted px-2 py-0.5 rounded-full bg-surface-2">
            V2
          </span>
        </div>
        <div className="text-sm text-muted leading-relaxed">
          Gold-client vouch codes and first-payment amnesty are in the spec
          (§7) but not yet enforced in the Move package. New users start at
          Bronze and earn up via real settled payments.
        </div>
      </Card>

      <MintPanel
        chainWired={chainWired}
        connected={!!account}
        address={account?.address}
        hasReputation={!!reputation}
        step={step}
        importCount={queuedImports.length}
        importStates={importStates}
        importInputs={importInputs}
        busy={busy}
        onMint={doMint}
      />
    </div>
  );
}

// ============================================================================
// Import row
// ============================================================================

function ImportRow({
  meta,
  state,
  value,
  onToggle,
  onValueChange,
}: {
  meta: { label: string; source: string; placeholder: string };
  state: ImportState;
  value: string;
  onToggle: () => void;
  onValueChange: (v: string) => void;
}) {
  const isOn = state !== "off";
  return (
    <div
      className={`rounded-md border transition ${
        state === "done"
          ? "border-success/40 bg-success/5"
          : state === "error"
            ? "border-danger/40 bg-danger/5"
            : isOn
              ? "border-signal/40 bg-signal-dim"
              : "border-border hover:border-foreground/30"
      }`}
    >
      <button
        onClick={onToggle}
        disabled={state === "signing" || state === "done"}
        className="w-full flex items-center justify-between p-3 text-left disabled:cursor-default"
      >
        <div>
          <div className="text-sm font-medium">{meta.label}</div>
          <div className="text-xs text-muted">source: {meta.source}</div>
        </div>
        <div className="text-xs font-mono">
          {state === "off" && "add"}
          {state === "on" && "✓ queued"}
          {state === "signing" && "signing…"}
          {state === "done" && "✓ on-chain"}
          {state === "error" && "× failed"}
        </div>
      </button>
      {isOn && state !== "done" && (
        <div className="px-3 pb-3">
          <input
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={meta.placeholder}
            disabled={state === "signing"}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:border-signal outline-none disabled:opacity-60"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Mint panel
// ============================================================================

function MintPanel({
  chainWired,
  connected,
  address,
  hasReputation,
  step,
  importCount,
  importStates,
  importInputs,
  busy,
  onMint,
}: {
  chainWired: boolean;
  connected: boolean;
  address?: string;
  hasReputation: boolean;
  step: Step;
  importCount: number;
  importStates: Record<ImportKey, ImportState>;
  importInputs: Record<ImportKey, string>;
  busy: boolean;
  onMint: () => void;
}) {
  void importStates;
  void importInputs;
  if (!chainWired) {
    return (
      <Link
        href="/app"
        className="block w-full text-center bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition"
      >
        Continue to dashboard (demo)
      </Link>
    );
  }

  if (step.kind === "complete") {
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
        <div className="mt-3 font-medium">
          Reputation minted{importCount > 0 ? ` + ${importCount} attestation${importCount === 1 ? "" : "s"}` : ""}
        </div>
        <div className="mt-1 text-xs text-muted">Redirecting…</div>
        <a
          href={`https://suiscan.xyz/testnet/tx/${step.digest}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-xs font-mono text-signal hover:underline"
        >
          {step.digest.slice(0, 10)}…{step.digest.slice(-6)}
        </a>
      </Card>
    );
  }

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

  if (!connected) {
    return (
      <Card className="space-y-3 text-center">
        <div className="text-sm text-muted">
          Connect a Sui wallet (or Sign in with Google) to mint your
          reputation on testnet.
        </div>
        <div className="flex justify-center">
          <WalletButton />
        </div>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {step.kind === "error" ? (
        <motion.div key="err" {...FADE}>
          <Card className="border-danger/40 bg-danger/5 space-y-3">
            <div className="text-sm text-danger font-medium">Mint failed</div>
            <div className="text-xs text-muted font-mono break-all">
              {step.message}
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
          disabled={busy}
          onClick={onMint}
          className="w-full bg-signal text-background py-3 rounded-md font-medium hover:opacity-90 transition disabled:opacity-60"
        >
          {step.kind === "minting" && "Sign mint transaction in your wallet…"}
          {step.kind === "minted" &&
            (importCount > 0 ? "Mint settled — next, signing imports…" : "Settled")}
          {step.kind === "importing" &&
            `Signing import ${step.index + 1} of ${importCount}…`}
          {step.kind === "idle" &&
            (importCount > 0
              ? `Mint reputation + sign ${importCount} import${importCount === 1 ? "" : "s"} (${importCount + 1} txs)`
              : "Mint reputation on Sui")}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
