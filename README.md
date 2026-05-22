# Kano Rails

Reputation-gated cross-border payment rails for African freelancers, on Sui.

Live: **https://kanorails.vercel.app**

## What it is

Every settled payment, every client attestation stacks on a Sui object owned by the freelancer. Tier — Bronze / Silver / Gold — determines fee rate, offramp priority, and whether Kano sponsors the client's gas. Trust travels.

## How it's built

- **Frontend** — Next.js 16, TypeScript, Tailwind 4, `@mysten/dapp-kit`, Framer Motion
- **Move** — `ReputationObject` (owned, additive, dispute-driven downgrade) and `PaymentObject<USDC>` (shared, tier-snapshot locked at creation)
- **Client UX** — zkLogin + sponsored transactions, so a payer with no wallet can pay with a Google sign-in and a card

## Why Sui

Owned objects make reputation a first-class asset in the user's wallet, not state inside a contract. Move composability lets any future Sui protocol read the same reputation object. And Sui is the only major chain where zkLogin + sponsored transactions can deliver a walletless, gasless client experience without account-abstraction hacks.

## Submitted to

Sui Overflow 2026 — DeFi & Payments track.

## Repo layout

```
app/   — Next.js frontend
move/  — Move package (kano_rails::reputation, kano_rails::payment)
```
