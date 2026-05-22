import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/mock-data";

const TIER_STYLES: Record<Tier, string> = {
  Bronze: "text-tier-bronze border-tier-bronze/40 bg-tier-bronze/10",
  Silver: "text-tier-silver border-tier-silver/40 bg-tier-silver/10",
  Gold: "text-tier-gold border-tier-gold/40 bg-tier-gold/10",
};

export function TierBadge({
  tier,
  size = "sm",
}: {
  tier: Tier;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        TIER_STYLES[tier]
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {tier}
    </span>
  );
}
