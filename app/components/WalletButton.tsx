"use client";

import { ConnectButton } from "@mysten/dapp-kit";

export function WalletButton() {
  return (
    <div className="[&_button]:!bg-surface [&_button]:!text-foreground [&_button]:!border [&_button]:!border-border [&_button]:!rounded-md [&_button]:!text-sm [&_button]:!px-3 [&_button]:!py-1.5 [&_button]:!font-medium [&_button:hover]:!border-foreground/30 [&_button]:!font-sans">
      <ConnectButton connectText="Connect wallet" />
    </div>
  );
}
