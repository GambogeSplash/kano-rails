import Link from "next/link";
import { PainCalculator } from "@/components/PainCalculator";
import { Reveal, RevealInView } from "@/components/Reveal";

export default function Landing() {
  return (
    <div>
      <Hero />
      <Pain />
      <HowItWorks />
      <WhySui />
      <FinalCta />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(77,162,255,0.18), transparent 50%)",
        }}
      />
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl">
          <Reveal delay={0}>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted border border-border rounded-full px-3 py-1">
              <span className="size-1.5 rounded-full bg-signal" />
              Sui Overflow 2026 · DeFi & Payments
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-6 text-5xl md:text-6xl font-medium tracking-tight leading-[1.05]">
              Your history.
              <br />
              <span className="text-signal">Your rails.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.22}>
            <p className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
              Reputation-gated cross-border payments for African freelancers.
              Every contract you finish, every client who pays, compounds into
              on-chain credibility — and unlocks faster, cheaper rails
              automatically.
            </p>
          </Reveal>
          <Reveal delay={0.34}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="bg-signal text-background px-5 py-3 rounded-md font-medium hover:opacity-90 transition"
              >
                Launch app →
              </Link>
              <Link
                href="/p/chidera"
                className="px-5 py-3 rounded-md border border-border hover:border-foreground/30 transition text-sm"
              >
                See a live reputation profile
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Pain() {
  return (
    <section className="py-24 border-t border-border">
      <RevealInView className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted font-mono">
              The problem
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-medium leading-tight">
              African freelancers lose{" "}
              <span className="text-danger">8–12% per payment</span> to informal
              conversion routes.
            </h2>
            <ul className="mt-6 space-y-3 text-muted">
              <li className="flex gap-3">
                <span className="text-muted font-mono shrink-0 w-20">
                  SWIFT
                </span>
                <span>3–5 business days, 5–8% in fees</span>
              </li>
              <li className="flex gap-3">
                <span className="text-muted font-mono shrink-0 w-20">P2P</span>
                <span>
                  8–12% real cost when you include spread and informal markup
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-muted font-mono shrink-0 w-20">
                  Holds
                </span>
                <span>
                  Nigerian accounts get flagged constantly — regardless of
                  history
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-muted font-mono shrink-0 w-20">
                  Trust
                </span>
                <span>
                  Every new platform resets your reputation to zero
                </span>
              </li>
            </ul>
            <p className="mt-6 text-foreground">
              The deeper problem: trust is already there. Years of completed
              contracts, repeat clients, on-time delivery. It just doesn't
              travel anywhere.
            </p>
          </div>
          <PainCalculator />
        </div>
      </RevealInView>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Reputation lives in your wallet",
      body: "Every settled payment, every client attestation, stacks on a Sui object you own. Not in a contract Kano controls. In your wallet, beside your tokens.",
    },
    {
      n: "02",
      title: "Tier unlocks better rails",
      body: "Silver: 0.8% fee, priority offramp, sponsored gas for your client. Gold: 0.3%, dedicated lane, under 5 minutes to your bank. Bronze never traps you — cold-start ramps put you at Silver from payment one.",
    },
    {
      n: "03",
      title: "Your client never sees crypto",
      body: "They click the link. Sign in with Google. Pay with a card. zkLogin provisions their Sui address in seconds. Sponsored transactions cover gas. They never type the word 'wallet.'",
    },
    {
      n: "04",
      title: "Reputation is portable",
      body: "Drop your kano.rails/@handle in any pitch. Any Sui protocol can read your reputation object — lending markets, DAOs, payroll, future products. The credential travels.",
    },
  ];
  return (
    <section className="py-24 border-t border-border">
      <RevealInView className="max-w-6xl mx-auto px-6">
        <div className="text-xs uppercase tracking-wider text-muted font-mono">
          How it works
        </div>
        <h2 className="mt-3 text-3xl md:text-4xl font-medium leading-tight max-w-2xl">
          Four primitives. One reputation. Better rails the longer you work.
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((s, i) => (
            <RevealInView delay={i * 0.08} key={s.n}>
              <div className="rounded-xl border border-border bg-surface p-6 h-full">
                <div className="text-xs font-mono text-signal">{s.n}</div>
                <div className="mt-2 text-xl font-medium">{s.title}</div>
                <p className="mt-3 text-muted leading-relaxed">{s.body}</p>
              </div>
            </RevealInView>
          ))}
        </div>
      </RevealInView>
    </section>
  );
}

function WhySui() {
  return (
    <section className="py-24 border-t border-border">
      <RevealInView className="max-w-6xl mx-auto px-6">
        <div className="text-xs uppercase tracking-wider text-muted font-mono">
          Why Sui
        </div>
        <h2 className="mt-3 text-3xl md:text-4xl font-medium leading-tight max-w-2xl">
          The only chain where the client side is actually solvable.
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="text-foreground font-medium">
              Owned objects = self-sovereign reputation
            </div>
            <p className="mt-2 text-muted leading-relaxed">
              State lives in objects owned by addresses, not in contracts.
              Chidera's reputation is hers — sits in her wallet beside her
              tokens. Not stored in a Kano contract we could modify or revoke.
            </p>
          </div>
          <div>
            <div className="text-foreground font-medium">
              Move composability is the V2 thesis
            </div>
            <p className="mt-2 text-muted leading-relaxed">
              Payment objects read reputation objects at creation time —
              idiomatic Move. Any future Sui protocol (lending, DAO, payroll)
              can read the same primitive without permission. The rail is just
              the first app.
            </p>
          </div>
          <div>
            <div className="text-foreground font-medium">
              zkLogin + sponsored tx = no-wallet client UX
            </div>
            <p className="mt-2 text-muted leading-relaxed">
              The Berlin client signs in with Google. Sui provisions an address
              in seconds. Kano sponsors the gas. They never touch a wallet,
              never type a seed phrase, never see the word crypto. Try that on
              Ethereum.
            </p>
          </div>
        </div>
      </RevealInView>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-32 border-t border-border">
      <RevealInView className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-medium leading-tight">
          Stop starting from zero.
        </h2>
        <p className="mt-5 text-muted text-lg max-w-xl mx-auto">
          Your work history is already evidence of trust. Put it on chain. Use
          it.
        </p>
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Link
            href="/onboarding"
            className="bg-signal text-background px-5 py-3 rounded-md font-medium hover:opacity-90 transition"
          >
            Start onboarding →
          </Link>
          <Link
            href="/app"
            className="px-5 py-3 rounded-md border border-border hover:border-foreground/30 transition text-sm"
          >
            See the dashboard
          </Link>
        </div>
      </RevealInView>
    </section>
  );
}
