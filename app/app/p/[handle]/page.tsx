import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardLabel } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { CHIDERA } from "@/lib/mock-data";
import { formatUSD, relativeTime, truncate } from "@/lib/utils";

export default async function PublicProfile({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  if (handle !== "chidera") notFound();
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
          {`<a href="https://kano.rails/@${p.handle}"><img src="https://kano.rails/badge/${p.handle}.svg" /></a>`}
        </div>
      </Card>

      <div className="text-center text-xs text-muted font-mono">
        any sui protocol can read this reputation object · 0x{p.address.slice(2, 10)}
      </div>
    </div>
  );
}
