import Link from "next/link";
import { Card, CardLabel, Stat } from "@/components/Card";
import { TierBadge } from "@/components/TierBadge";
import { SavingsHero } from "@/components/SavingsHero";
import { ChainStatus } from "@/components/ChainStatus";
import { CHIDERA, PROGRESS_TO_GOLD, TIER_CONFIG } from "@/lib/mock-data";
import { formatUSD, relativeTime, truncate } from "@/lib/utils";

export default function Dashboard() {
  const tier = TIER_CONFIG[CHIDERA.tier];
  const nativeAttestations = CHIDERA.attestations.filter(
    (a) => a.source === "native"
  ).length;
  const goldProgress =
    ((CHIDERA.completedPayments / 10) * 0.6 + (nativeAttestations / 4) * 0.4) *
    100;

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <ChainStatus />
          <h1 className="text-3xl font-medium mt-2">
            Welcome back, {CHIDERA.displayName.split(" ")[0]}
          </h1>
        </div>
        <Link
          href="/create"
          className="bg-signal text-background px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
        >
          New request
        </Link>
      </header>

      <SavingsHero
        savedCents={CHIDERA.lifetimeSavedVsP2P}
        paymentCount={CHIDERA.completedPayments}
        avgOfframpMinutes={CHIDERA.averageOfframpMinutes}
        feeBpsCurrent={tier.feeBps}
      />

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardLabel>Reputation</CardLabel>
            <div className="mt-2 flex items-center gap-3">
              <TierBadge tier={CHIDERA.tier} size="lg" />
              <span className="text-muted text-sm font-mono">
                score {CHIDERA.weightedAttestationScore}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-muted font-mono">
            <div>{PROGRESS_TO_GOLD.paymentsNeeded} payments → Gold</div>
            <div>
              {PROGRESS_TO_GOLD.attestationsNeeded} native attestations → Gold
            </div>
          </div>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-background overflow-hidden">
          <div
            className="h-full bg-tier-gold"
            style={{ width: `${Math.min(100, goldProgress)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted font-mono">
          <span>Silver</span>
          <span>{Math.round(goldProgress)}%</span>
          <span>Gold</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Stat
            label="Lifetime earned"
            value={formatUSD(CHIDERA.totalVolumeUsdc)}
            sub={`${CHIDERA.completedPayments} settled payments`}
          />
        </Card>
        <Card>
          <Stat
            label="Saved vs P2P"
            value={formatUSD(CHIDERA.lifetimeSavedVsP2P)}
            sub="estimated"
          />
        </Card>
        <Card>
          <Stat
            label="Avg offramp"
            value={`${CHIDERA.averageOfframpMinutes} min`}
            sub={`Silver: ${tier.offrampEtaMinutes} min queue`}
          />
        </Card>
        <Card>
          <Stat
            label="Current fee"
            value={`${(tier.feeBps / 100).toFixed(2)}%`}
            sub={
              tier.clientGasSponsored ? "client gas sponsored" : "client pays gas"
            }
          />
        </Card>
      </div>

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-lg font-medium">Recent payments</h2>
          <Link
            href="/p/chidera"
            className="text-xs text-muted hover:text-foreground font-mono"
          >
            view public profile →
          </Link>
        </div>
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
      </section>

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
                <div className="text-xs font-mono text-muted">×{a.weight}</div>
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
    </div>
  );
}
