import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Shell } from "@/components/Shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kano-rails.vercel.app"),
  title: {
    default:
      "Kano Rails — Reputation-gated payment rails for African freelancers",
    template: "%s · Kano Rails",
  },
  description:
    "Your on-chain work history determines your fee tier and offramp priority. Built on Sui. Sui Overflow 2026.",
  applicationName: "Kano Rails",
  authors: [{ name: "Kano Rails" }],
  keywords: [
    "Sui",
    "stablecoin",
    "USDC",
    "freelancer payments",
    "African fintech",
    "reputation",
    "DeFi",
    "Sui Overflow 2026",
  ],
  openGraph: {
    type: "website",
    title:
      "Kano Rails — Reputation-gated payment rails for African freelancers",
    description:
      "Your history. Your rails. On-chain work history determines fee tier and offramp priority. Built on Sui.",
    siteName: "Kano Rails",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Kano Rails — Reputation-gated payment rails for African freelancers",
    description:
      "Your history. Your rails. Built on Sui — Sui Overflow 2026.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
