"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";

type Ramp = "imports" | "vouch" | "amnesty" | null;

export default function Onboarding() {
  const [ramp, setRamp] = useState<Ramp>(null);
  const [imports, setImports] = useState({
    linkedin: false,
    github: false,
    evm: false,
  });
  const [vouchCode, setVouchCode] = useState("");

  const importCount = Object.values(imports).filter(Boolean).length;
  const qualifiesViaImports = importCount >= 3;
  const qualifiesViaVouch = vouchCode.length >= 6;
  const startTier =
    qualifiesViaImports || qualifiesViaVouch || ramp === "amnesty"
      ? "Silver"
      : "Bronze";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-medium">Welcome to Kano Rails</h1>
        <p className="text-muted mt-2 max-w-md mx-auto">
          New here? Don't start at the bottom. Pick a cold-start ramp so your
          first payment lands at Silver terms.
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
                {importCount} / 3 — {qualifiesViaImports ? "Silver unlocked" : "need " + (3 - importCount) + " more"}
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

      <Link
        href="/app"
        className="block w-full text-center bg-signal text-background py-3 rounded-md font-medium"
      >
        Continue with {startTier} terms
      </Link>
    </div>
  );
}

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
