import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { AppProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "BioBloke Edventures",
  description:
    "Adaptive conservation education platform — short-form wildlife media, adaptive learning pathways, and class insights by The Biology Bloke.",
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
