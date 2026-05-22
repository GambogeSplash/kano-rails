"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import {
  fetchReputation,
  isChainWired,
  TIER_NAMES,
  type OnChainReputation,
} from "@/lib/sui";
import { CHIDERA } from "@/lib/mock-data";
import { formatUSD, relativeTime, truncate } from "@/lib/utils";

export default function PublicProfile({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const client = useSuiClient();
  const account = useCurrentAccount();

  const isAddress = handle.startsWith("0x") && handle.length >= 42;
  const isChidera = handle === "chidera";
  const isOwnProfile = !!(account && isAddress && account.address === handle);

  const repQuery = useQuery({
    queryKey: ["kano-rep-public", handle],
    queryFn: () =>
      isChainWired() && isAddress
        ? fetchReputation(client as never, handle)
        : null,
    enabled: isChainWired() && isAddress,
  });

  if (!isChidera && !isAddress) notFound();

  if (isChidera) {
    return <ChideraProfile />;
  }

  // Address path
  const rep = repQuery.data;
  const loading = repQuery.isLoading;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="text-center">
        <div className="size-16 rounded-full bg-signal-dim mx-auto flex items-center justify-center text-2xl font-medium text-signal font-mono">
          {handle.slice(2, 4).toUpperCase()}
        </div>
        <h1 className="mt-4 text-2xl font-medium font-mono">
          {truncate(handle, 8, 6)}
        </h1>
        <div className="mt-1 text-xs text-muted font-mono">
          on Sui testnet
        </div>
        {loading ? (
          <div className="mt-4 text-sm text-muted">Loading reputation…</div>
        ) : rep ? (
          <ReputationLive
            rep={rep}
            address={handle}
            isOwnProfile={isOwnProfile}
          />
        ) : (
          <NoReputation address={handle} />
        )}
      </Card>

      {rep && <StatGrid rep={rep} />}

      {rep && (
        <ShareProfile handle={handle} />
      )}

      <div className="text-center text-xs text-muted font-mono">
        {rep
          ? `any sui protocol can read this reputation object · ${truncate(rep.objectId)}`
          : "any sui protocol can read this reputation object once minted"}
      </div>
    </div>
  );
}

function ReputationLive({
  rep,
  address,
  isOwnProfile,
}: {
  rep: OnChainReputation;
  address: string;
  isOwnProfile: boolean;
}) {
  const tierName = TIER_NAMES[rep.tier];
  return (
    <>
      <div className="mt-4 flex items-center justify-center gap-2">
        <TierBadge tier={tierName} size="lg" />
        <span className="text-xs text-muted font-mono">
          verified on Sui · {rep.walletAgeDays} days
        </span>
      </div>
      {isOwnProfile ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/app"
            className="bg-signal text-background px-5 py-2 rounded-md text-sm font-medium"
          >
            Dashboard →
          </Link>
          <Link
            href="/create"
            className="px-5 py-2 rounded-md border border-border text-sm hover:border-foreground/30"
          >
            New request
          </Link>
          <Link
            href="/offramp"
            className="px-5 py-2 rounded-md border border-border text-sm hover:border-foreground/30"
          >
            Withdraw
          </Link>
        </div>
      ) : (
        <Link
          href={`/create?to=${address}`}
          className="inline-block mt-5 bg-signal text-background px-5 py-2 rounded-md text-sm font-medium"
        >
          Pay {truncate(address, 6, 4)} →
        </Link>
      )}
    </>
  );
}

function ShareProfile({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://kanorails.vercel.app/p/${handle}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <Card>
      <CardLabel>Share this profile</CardLabel>
      <div className="mt-3 flex items-center gap-2 bg-background border border-border rounded-md p-1 pl-3">
        <div className="flex-1 font-mono text-xs break-all text-muted">
          {url}
        </div>
        <button
          onClick={copy}
          className="shrink-0 px-3 py-1.5 rounded-md bg-surface-2 text-xs font-mono hover:bg-surface"
        >
          {copied ? "copied ✓" : "copy"}
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `My on-chain freelancer reputation on @SuiNetwork · ${url}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 rounded-md bg-surface-2 text-xs font-mono hover:bg-surface"
        >
          share
        </a>
      </div>
      <details className="mt-3">
        <summary className="text-xs text-muted font-mono cursor-pointer">
          embeddable badge
        </summary>
        <div className="mt-2 bg-background border border-border rounded-md p-3 font-mono text-xs break-all">
          {`<a href="${url}"><img src="https://kanorails.vercel.app/badge/${handle}.svg" /></a>`}
        </div>
      </details>
    </Card>
  );
}

function NoReputation({ address }: { address: string }) {
  return (
    <div className="mt-5 text-sm text-muted">
      No Kano Rails reputation object yet for this address.
      <div className="mt-3">
        <Link
          href="/onboarding"
          className="inline-block bg-signal text-background px-4 py-1.5 rounded-md text-xs font-medium"
        >
          Mint one →
        </Link>
      </div>
      <div className="mt-2 font-mono text-[10px]">
        connect as {truncate(address, 6, 4)} to claim this handle
      </div>
    </div>
  );
}

function StatGrid({ rep }: { rep: OnChainReputation }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="text-center">
        <CardLabel>Payments</CardLabel>
        <div className="mt-2 text-2xl font-medium tabular-nums">
          {rep.completedPayments}
        </div>
      </Card>
      <Card className="text-center">
        <CardLabel>Attestations</CardLabel>
        <div className="mt-2 text-2xl font-medium tabular-nums">
          {rep.nativeAttestationCount}
        </div>
      </Card>
      <Card className="text-center">
        <CardLabel>Lifetime volume</CardLabel>
        <div className="mt-2 text-2xl font-medium tabular-nums">
          {formatUSD(rep.totalVolumeUsdcCents)}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Demo path — preserves the seeded Chidera profile for the demo video
// ============================================================================

function ChideraProfile() {
  const p = CHIDERA;
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="text-center">
        <div className="size-16 rounded-full bg-signal-dim mx-auto flex items-center justify-center text-2xl font-medium text-signal">
          {p.displayName[0]}
        </div>
        <h1 className="mt-4 text-2xl font-medium">{p.displayName}</h1>
        <div className="mt-1 text-xs text-muted font-mono">
          {truncate(p.address)}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <TierBadge tier={p.tier} size="lg" />
          <span className="text-xs text-muted font-mono">
            verified on Sui · {p.walletAgeDays} days
          </span>
        </div>
        <Link
          href={`/create?to=${p.handle}`}
          className="inline-block mt-5 bg-signal text-background px-5 py-2 rounded-md text-sm font-medium"
        >
          Pay {p.displayName.split(" ")[0]} →
        </Link>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardLabel>Payments</CardLabel>
          <div className="mt-2 text-2xl font-medium tabular-nums">
            {p.completedPayments}
          </div>
        </Card>
        <Card className="text-center">
          <CardLabel>Attestations</CardLabel>
          <div className="mt-2 text-2xl font-medium tabular-nums">
            {p.attestationCount}
          </div>
        </Card>
        <Card className="text-center">
          <CardLabel>Lifetime volume</CardLabel>
          <div className="mt-2 text-2xl font-medium tabular-nums">
            {formatUSD(p.totalVolumeUsdc)}
          </div>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-medium mb-3">Attestation log</h2>
        <Card className="p-0">
          {p.attestations.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border-b border-border last:border-0"
            >
              <div>
                <div className="text-sm font-medium">{a.clientName}</div>
                <div className="text-xs text-muted font-mono">
                  {a.clientDomain} ·{" "}
                  {a.source === "native"
                    ? "native"
                    : `imported (${a.source.replace("imported-", "")})`}
                </div>
              </div>
              <div className="text-xs text-muted font-mono text-right">
                <div>{relativeTime(a.givenAt)}</div>
                <div>weight ×{a.weight}</div>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <Card>
        <CardLabel>Embeddable badge</CardLabel>
        <div className="mt-3 bg-background border border-border rounded-md p-3 font-mono text-xs">
          {`<a href="https://kanorails.vercel.app/p/${p.handle}"><img src="https://kanorails.vercel.app/badge/${p.handle}.svg" /></a>`}
        </div>
      </Card>

      <div className="text-center text-xs text-muted font-mono">
        any sui protocol can read this reputation object · 0x{p.address.slice(2, 10)}
      </div>
    </div>
  );
}
