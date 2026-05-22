export type Tier = "Bronze" | "Silver" | "Gold";

export interface TierConfig {
  feeBps: number;
  offrampPriority: "Standard" | "Priority" | "Dedicated";
  offrampEtaMinutes: string;
  clientGasSponsored: boolean;
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  Bronze: {
    feeBps: 150,
    offrampPriority: "Standard",
    offrampEtaMinutes: "30–60",
    clientGasSponsored: false,
  },
  Silver: {
    feeBps: 80,
    offrampPriority: "Priority",
    offrampEtaMinutes: "10–15",
    clientGasSponsored: true,
  },
  Gold: {
    feeBps: 30,
    offrampPriority: "Dedicated",
    offrampEtaMinutes: "<5",
    clientGasSponsored: true,
  },
};

export interface Payment {
  id: string;
  client: string;
  amountUsdc: number;
  feeBps: number;
  tier: Tier;
  status: "pending" | "settled" | "disputed";
  createdAt: Date;
  settledAt?: Date;
  attestationGiven: boolean;
}

export interface Attestation {
  clientName: string;
  clientDomain: string;
  givenAt: Date;
  source: "native" | "imported-linkedin" | "imported-github" | "imported-evm";
  weight: number;
}

export interface FreelancerProfile {
  handle: string;
  displayName: string;
  address: string;
  tier: Tier;
  completedPayments: number;
  totalVolumeUsdc: number;
  attestationCount: number;
  weightedAttestationScore: number;
  walletAgeDays: number;
  activeDisputes: number;
  lifetimeSavedVsP2P: number;
  averageOfframpMinutes: number;
  payments: Payment[];
  attestations: Attestation[];
}

export const CHIDERA: FreelancerProfile = {
  handle: "chidera",
  displayName: "Chidera O.",
  address: "0x4f9b1c8a3d2e5f6a7b8c9d0e1f2a3b4c5d6e7f80a1b2c3d4e5f6a7b8c9d0e1c2a",
  tier: "Silver",
  completedPayments: 6,
  totalVolumeUsdc: 18450_00,
  attestationCount: 3,
  weightedAttestationScore: 280,
  walletAgeDays: 142,
  activeDisputes: 0,
  lifetimeSavedVsP2P: 1844_00,
  averageOfframpMinutes: 13,
  payments: [
    {
      id: "pay_9k2x",
      client: "berlin@startup.com",
      amountUsdc: 3000_00,
      feeBps: 80,
      tier: "Silver",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 12),
      attestationGiven: false,
    },
    {
      id: "pay_8j1w",
      client: "london@agency.co.uk",
      amountUsdc: 2200_00,
      feeBps: 80,
      tier: "Silver",
      status: "settled",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 11),
      attestationGiven: true,
    },
    {
      id: "pay_7h0v",
      client: "nyc@founder.io",
      amountUsdc: 4500_00,
      feeBps: 80,
      tier: "Silver",
      status: "settled",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11),
      settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11 + 1000 * 60 * 14),
      attestationGiven: true,
    },
    {
      id: "pay_6g9u",
      client: "berlin@startup.com",
      amountUsdc: 1800_00,
      feeBps: 80,
      tier: "Silver",
      status: "settled",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28),
      settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28 + 1000 * 60 * 9),
      attestationGiven: false,
    },
    {
      id: "pay_5f8t",
      client: "london@agency.co.uk",
      amountUsdc: 3200_00,
      feeBps: 150,
      tier: "Bronze",
      status: "settled",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55),
      settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55 + 1000 * 60 * 47),
      attestationGiven: true,
    },
    {
      id: "pay_4e7s",
      client: "nyc@founder.io",
      amountUsdc: 3750_00,
      feeBps: 150,
      tier: "Bronze",
      status: "settled",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 88),
      settledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 88 + 1000 * 60 * 52),
      attestationGiven: false,
    },
  ],
  attestations: [
    {
      clientName: "Berlin Startup",
      clientDomain: "startup.com",
      givenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      source: "native",
      weight: 100,
    },
    {
      clientName: "London Agency",
      clientDomain: "agency.co.uk",
      givenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55),
      source: "native",
      weight: 80,
    },
    {
      clientName: "LinkedIn (verified)",
      clientDomain: "linkedin.com",
      givenAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 142),
      source: "imported-linkedin",
      weight: 50,
    },
  ],
};

export const PROGRESS_TO_GOLD = {
  paymentsNeeded: Math.max(0, 10 - CHIDERA.completedPayments),
  attestationsNeeded: Math.max(0, 4 - CHIDERA.attestations.filter(a => a.source === "native").length),
};
