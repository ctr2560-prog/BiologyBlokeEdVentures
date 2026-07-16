import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { AppProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Edventra — by The Biology Bloke",
  description:
    "Edventra is an adaptive nature-based learning platform by The Biology Bloke. Short-form wildlife media, personalised learning pathways, and real-time class insights for Australian schools.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
