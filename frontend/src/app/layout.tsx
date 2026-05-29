import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "SIP Behaviour Analytics Platform",
  description:
    "A PhD research platform for predictive analysis of SIP investment, market volatility, and investor behaviour.",

  openGraph: {
    title: "SIP Behaviour Analytics Platform",
    description:
      "Participate in our PhD research survey on SIP investment behaviour and market volatility.",
    url: "https://sip-behaviour-analytics.vercel.app",
    siteName: "SIP Behaviour Analytics",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "SIP Behaviour Analytics Platform",
    description:
      "Participate in our PhD research survey on SIP investment behaviour and market volatility.",
  },
};
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
