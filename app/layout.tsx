import type { Metadata } from "next";
import { playfair, lato, montserrat } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "crazy4points — Travel Smarter. Earn More. Go Farther.",
    template: "%s | crazy4points",
  },
  description:
    "The intelligent travel rewards platform. Track transfer bonuses, find sweet spots, and get a ranked action plan for your points and miles — right now.",
  metadataBase: new URL("https://crazy4points.com"),
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
  },
  other: {
    "theme-color": "#6B2D8F",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lato.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-text-primary)]">
        {children}
      </body>
    </html>
  );
}
