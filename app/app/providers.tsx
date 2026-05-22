"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  WalletProvider,
  useSuiClient,
} from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { registerEnokiWallets } from "@mysten/enoki";
import { useEffect, useState } from "react";
import { ENOKI_API_KEY, GOOGLE_CLIENT_ID, isEnokiWired } from "@/lib/enoki";

import "@mysten/dapp-kit/dist/index.css";

const networks = {
  testnet: {
    url: getJsonRpcFullnodeUrl("testnet"),
    network: "testnet" as const,
  },
  mainnet: {
    url: getJsonRpcFullnodeUrl("mainnet"),
    network: "mainnet" as const,
  },
};

function EnokiBootstrap() {
  const client = useSuiClient();
  useEffect(() => {
    if (!isEnokiWired() || !GOOGLE_CLIENT_ID) return;
    const { unregister } = registerEnokiWallets({
      apiKey: ENOKI_API_KEY,
      providers: {
        google: { clientId: GOOGLE_CLIENT_ID },
      },
      client: client as never,
      network: "testnet",
    });
    return () => unregister?.();
  }, [client]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <EnokiBootstrap />
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
