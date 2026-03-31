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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lato.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--color-ivory)] text-[var(--color-charcoal)]">
        {children}
      </body>
    </html>
  );
}
