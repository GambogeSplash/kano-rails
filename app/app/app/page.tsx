"use client";

import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Card, CardLabel, Stat } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { SavingsHero } from "@/components/SavingsHero";
import { ChainStatus } from "@/components/ChainStatus";
import { WalletButton } from "@/components/WalletButton";
import {
  CHIDERA,
  PROGRESS_TO_GOLD,
  TIER_CONFIG,
  type Tier,
} from "@/lib/mock-data";
import { useReputation } from "@/lib/use-reputation";
import { TIER_NAMES } from "@/lib/sui";
import { formatUSD, relativeTime, truncate } from "@/lib/utils";

export default function Dashboard() {
  const account = useCurrentAccount();
  const { reputation, chainWired } = useReputation();

  // Live mode: chain wired + wallet connected + has a ReputationObject.
  const live = chainWired && account && reputation;

  const tierName: Tier = live
    ? TIER_NAMES[reputation.tier]
    : CHIDERA.tier;
  const tier = TIER_CONFIG[tierName];

  const completedPayments = live
    ? reputation.completedPayments
    : CHIDERA.completedPayments;
  const totalVolume = live
    ? reputation.totalVolumeUsdcCents
    : CHIDERA.totalVolumeUsdc;
  const nativeAttestationCount = live
    ? reputation.nativeAttestationCount
    : CHIDERA.attestations.filter((a) => a.source === "native").length;
  const lifetimeSaved = live
    ? // Rough estimate: assume 10.4% P2P loss vs current tier's fee
      Math.round(
        reputation.totalVolumeUsdcCents *
          ((10.4 - tier.feeBps / 100) / 100),
      )
    : CHIDERA.lifetimeSavedVsP2P;
  const avgOfframp = live
    ? parseInt(tier.offrampEtaMinutes.split("–")[0] || "10") || 10
    : CHIDERA.averageOfframpMinutes;
  const walletAge = live ? reputation.walletAgeDays : 142;
  const displayAddress = live ? account.address : CHIDERA.address;
  const displayName = live
    ? `0x${account.address.slice(2, 6)}`
    : CHIDERA.displayName.split(" ")[0];

  const goldProgress =
    ((completedPayments / 10) * 0.6 +
      (nativeAttestationCount / 4) * 0.4) *
    100;

  return (
    <div className="space-y-8">
      {!live && (
        <DemoBanner
          chainWired={chainWired}
          connected={!!account}
          hasRep={!!reputation}
        />
      )}

      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <ChainStatus />
          <h1 className="text-3xl font-medium mt-2">
            {live
              ? `Welcome back, ${displayName}`
              : `Welcome back, ${displayName}`}
          </h1>
          {live && (
            <div className="text-xs text-muted font-mono mt-1">
              {truncate(displayAddress)} · wallet age {walletAge}d
            </div>
          )}
        </div>
        <Link
          href="/create"
          className="bg-signal text-background px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
        >
          New request
        </Link>
      </header>

      <SavingsHero
        savedCents={lifetimeSaved}
        paymentCount={completedPayments}
        avgOfframpMinutes={avgOfframp}
        feeBpsCurrent={tier.feeBps}
      />

      <QuickActions live={!!live} address={displayAddress} />

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardLabel>Reputation</CardLabel>
            <div className="mt-2 flex items-center gap-3">
              <TierBadge tier={tierName} size="lg" />
              {live ? (
                <span className="text-muted text-sm font-mono">
                  score {reputation.weightedAttestationScore}
                </span>
              ) : (
                <span className="text-muted text-sm font-mono">
                  score {CHIDERA.weightedAttestationScore}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-muted font-mono">
            <div>
              {Math.max(0, 10 - completedPayments)} payments → Gold
            </div>
            <div>
              {Math.max(0, 4 - nativeAttestationCount)} native attestations → Gold
            </div>
          </div>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-background overflow-hidden">
          <div
            className="h-full bg-tier-gold transition-all duration-700"
            style={{ width: `${Math.min(100, goldProgress)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted font-mono">
          <span>{tierName}</span>
          <span>{Math.round(goldProgress)}%</span>
          <span>Gold</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Stat
            label="Lifetime earned"
            value={formatUSD(totalVolume)}
            sub={`${completedPayments} settled payments`}
          />
        </Card>
        <Card>
          <Stat
            label="Saved vs P2P"
            value={formatUSD(lifetimeSaved)}
            sub="estimated"
          />
        </Card>
        <Card>
          <Stat
            label="Avg offramp"
            value={`${avgOfframp} min`}
            sub={`${tierName}: ${tier.offrampEtaMinutes} min queue`}
          />
        </Card>
        <Card>
          <Stat
            label="Current fee"
            value={`${(tier.feeBps / 100).toFixed(2)}%`}
            sub={
              tier.clientGasSponsored
                ? "client gas sponsored"
                : "client pays gas"
            }
          />
        </Card>
      </div>

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-lg font-medium">Recent payments</h2>
          <Link
          href={live ? `/p/${displayAddress}` : "/p/chidera"}
          className="text-xs text-muted hover:text-foreground font-mono"
        >
          view public profile →
        </Link>
        </div>
        {live ? (
          completedPayments === 0 ? (
            <Card className="text-center py-12">
              <div className="text-muted text-sm">
                No payments yet. Create your first one to start building
                reputation.
              </div>
              <Link
                href="/create"
                className="inline-block mt-4 bg-signal text-background px-4 py-2 rounded-md text-sm font-medium"
              >
                Create payment request →
              </Link>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <div className="text-muted text-sm">
                {completedPayments} settled payments on-chain. Per-payment
                history will appear here once we wire event indexing.
              </div>
              <div className="mt-2 text-xs text-muted font-mono">
                total volume {formatUSD(totalVolume)}
              </div>
            </Card>
          )
        ) : (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted font-mono uppercase tracking-wider">
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-normal">Client</th>
                  <th className="text-left p-4 font-normal">Tier</th>
                  <th className="text-right p-4 font-normal">Amount</th>
                  <th className="text-right p-4 font-normal">Fee</th>
                  <th className="text-right p-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {CHIDERA.payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-surface-2 transition"
                  >
                    <td className="p-4 font-mono text-xs">{p.client}</td>
                    <td className="p-4">
                      <TierBadge tier={p.tier} />
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      {formatUSD(p.amountUsdc)}
                    </td>
                    <td className="p-4 text-right tabular-nums text-muted">
                      {formatUSD((p.amountUsdc * p.feeBps) / 10000)}
                    </td>
                    <td className="p-4 text-right">
                      {p.status === "pending" ? (
                        <span className="text-warn font-mono text-xs">
                          pending · {relativeTime(p.createdAt)}
                        </span>
                      ) : p.status === "disputed" ? (
                        <span className="text-danger font-mono text-xs">
                          disputed
                        </span>
                      ) : (
                        <span className="text-success font-mono text-xs">
                          settled ·{" "}
                          {p.settledAt ? relativeTime(p.settledAt) : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {!live && (
        <section>
          <h2 className="text-lg font-medium mb-3">Attestations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CHIDERA.attestations.map((a, i) => (
              <Card key={i} className="text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{a.clientName}</div>
                    <div className="text-xs text-muted font-mono mt-0.5">
                      {a.clientDomain}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-muted">
                    ×{a.weight}
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted">
                  {a.source === "native"
                    ? "Native attestation"
                    : `Imported · ${a.source.replace("imported-", "")}`}
                  {" · "}
                  {relativeTime(a.givenAt)}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* unused for live, keeps compiler happy with PROGRESS_TO_GOLD import */}
      <span className="hidden">{PROGRESS_TO_GOLD.paymentsNeeded}</span>
    </div>
  );
}

function QuickActions({
  live,
  address,
}: {
  live: boolean;
  address: string;
}) {
  const actions = [
    {
      href: "/create",
      label: "New payment request",
      sub: "Send a link to a client",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      ),
      primary: true,
    },
    {
      href: "/offramp",
      label: "Withdraw to bank",
      sub: "USDC → NGN via Yellow Card",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: live ? `/p/${address}` : "/p/chidera",
      label: "Share your profile",
      sub: "Copy a public reputation link",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a16 16 0 010 18M12 3a16 16 0 000 18" />
        </svg>
      ),
    },
    {
      href: "/onboarding",
      label: "Import attestations",
      sub: "Add LinkedIn / GitHub / EVM",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((a) => (
        <Link
          key={a.href + a.label}
          href={a.href}
          className={`group flex flex-col gap-1 rounded-xl border p-4 transition ${
            a.primary
              ? "border-signal/40 bg-signal-dim hover:bg-signal-dim/70"
              : "border-border bg-surface hover:border-foreground/30"
          }`}
        >
          <span
            className={`size-8 rounded-md flex items-center justify-center ${
              a.primary ? "bg-signal/20 text-signal" : "bg-surface-2 text-muted group-hover:text-foreground"
            }`}
          >
            <span className="size-4">{a.icon}</span>
          </span>
          <span
            className={`mt-2 text-sm font-medium ${
              a.primary ? "text-signal" : "text-foreground"
            }`}
          >
            {a.label}
          </span>
          <span className="text-xs text-muted leading-snug">{a.sub}</span>
        </Link>
      ))}
    </div>
  );
}

function DemoBanner({
  chainWired,
  connected,
  hasRep,
}: {
  chainWired: boolean;
  connected: boolean;
  hasRep: boolean;
}) {
  let message: string;
  let cta: React.ReactNode = null;

  if (!chainWired) {
    message =
      "Demo data — Move package not configured. Set NEXT_PUBLIC_KANO_PACKAGE_ID to wire chain.";
  } else if (!connected) {
    message = "Demo data — connect a wallet to see your own reputation.";
    cta = <WalletButton />;
  } else if (!hasRep) {
    message = "Demo data — you don't have a reputation object yet.";
    cta = (
      <Link
        href="/onboarding"
        className="bg-signal text-background px-3 py-1.5 rounded-md text-xs font-medium"
      >
        Mint reputation →
      </Link>
    );
  } else {
    return null;
  }

  return (
    <Card className="border-warn/40 bg-warn/5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-warn/15 text-warn">
          Demo
        </span>
        <span className="text-sm">{message}</span>
      </div>
      {cta}
    </Card>
  );
}
