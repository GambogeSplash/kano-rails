import {
  SuiJsonRpcClient,
  getJsonRpcFullnodeUrl,
} from "@mysten/sui/jsonRpc";
import {
  fetchReputation,
  isChainWired,
  TIER_NAMES,
  type OnChainReputation,
} from "@/lib/sui";
import { CHIDERA } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const TIER_COLORS = {
  Bronze: { fg: "#c08a52", bg: "#1c1410", border: "#403027" },
  Silver: { fg: "#c7c9d1", bg: "#15171b", border: "#373d44" },
  Gold: { fg: "#f4d35e", bg: "#1c1709", border: "#473b18" },
};

const SUI_BLUE = "#4DA2FF";

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateAddr(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;

  let displayName: string;
  let tier: "Bronze" | "Silver" | "Gold";
  let payments: number;
  let attestations: number;

  const isAddress = handle.startsWith("0x") && handle.length >= 42;

  if (handle === "chidera") {
    displayName = CHIDERA.displayName;
    tier = CHIDERA.tier;
    payments = CHIDERA.completedPayments;
    attestations = CHIDERA.attestationCount;
  } else if (isAddress && isChainWired()) {
    try {
      const client = new SuiJsonRpcClient({
        url: getJsonRpcFullnodeUrl("testnet"),
        network: "testnet",
      });
      const rep: OnChainReputation | null = await fetchReputation(
        client as never,
        handle,
      );
      if (rep) {
        displayName = truncateAddr(handle);
        tier = TIER_NAMES[rep.tier];
        payments = rep.completedPayments;
        attestations = rep.nativeAttestationCount;
      } else {
        displayName = truncateAddr(handle);
        tier = "Bronze";
        payments = 0;
        attestations = 0;
      }
    } catch {
      displayName = truncateAddr(handle);
      tier = "Bronze";
      payments = 0;
      attestations = 0;
    }
  } else {
    displayName = handle.slice(0, 12);
    tier = "Bronze";
    payments = 0;
    attestations = 0;
  }

  const c = TIER_COLORS[tier];

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="72" viewBox="0 0 280 72" role="img" aria-label="Kano Rails reputation ${tier}">
  <rect x="0.5" y="0.5" width="279" height="71" rx="11.5" fill="${c.bg}" stroke="${c.border}"/>
  <g transform="translate(16,16)">
    <circle cx="6" cy="6" r="6" fill="${SUI_BLUE}"/>
    <text x="20" y="10" font-family="ui-monospace, SF Mono, Menlo, monospace" font-size="11" font-weight="500" fill="#8a8894" letter-spacing="0.6">KANO RAILS</text>
  </g>
  <g transform="translate(16,38)">
    <text font-family="-apple-system, system-ui, Inter, sans-serif" font-size="14" font-weight="500" fill="#ededf0">${escape(displayName)}</text>
  </g>
  <g transform="translate(16,56)">
    <text font-family="ui-monospace, SF Mono, Menlo, monospace" font-size="10" fill="#8a8894">${payments} payments · ${attestations} attestations</text>
  </g>
  <g transform="translate(180,18)">
    <rect x="0" y="0" width="84" height="22" rx="11" fill="${c.fg}" fill-opacity="0.08" stroke="${c.fg}" stroke-opacity="0.4"/>
    <circle cx="12" cy="11" r="3" fill="${c.fg}"/>
    <text x="22" y="15" font-family="ui-monospace, SF Mono, Menlo, monospace" font-size="10" font-weight="600" fill="${c.fg}" letter-spacing="0.4">${tier.toUpperCase()}</text>
  </g>
  <g transform="translate(180,46)">
    <text font-family="ui-monospace, SF Mono, Menlo, monospace" font-size="8" fill="#8a8894" letter-spacing="0.3">VERIFIED ON SUI</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
