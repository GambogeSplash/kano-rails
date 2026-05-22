import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_NGN_PER_USDC = 1620;

function jitter(amount: number, pct = 0.4) {
  const delta = ((Math.random() * 2 - 1) * pct) / 100;
  return amount * (1 + delta);
}

export async function GET() {
  const rate = jitter(BASE_NGN_PER_USDC);
  const buy = rate * 0.997;
  const sell = rate * 1.003;
  return NextResponse.json({
    provider: "yellowcard-mock",
    pair: "USDC/NGN",
    rate: Number(rate.toFixed(2)),
    buy: Number(buy.toFixed(2)),
    sell: Number(sell.toFixed(2)),
    spread_pct: Number((((sell - buy) / rate) * 100).toFixed(3)),
    queue: {
      standard_eta_minutes: [30, 60],
      priority_eta_minutes: [10, 15],
      dedicated_eta_minutes: [2, 5],
    },
    fetched_at: new Date().toISOString(),
  });
}
