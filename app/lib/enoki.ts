import { EnokiClient } from "@mysten/enoki";

export const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY ?? "";
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const isEnokiWired = () => ENOKI_API_KEY.length > 0;

let _client: EnokiClient | null = null;

export function getEnokiClient(): EnokiClient | null {
  if (!isEnokiWired()) return null;
  if (!_client) {
    _client = new EnokiClient({ apiKey: ENOKI_API_KEY });
  }
  return _client;
}

export const ENOKI_PROVIDERS = GOOGLE_CLIENT_ID
  ? {
      google: { clientId: GOOGLE_CLIENT_ID },
    }
  : {};
