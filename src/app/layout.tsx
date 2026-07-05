import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-bangers",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Biology Bloke Edventures",
  description: "A teacher-led, student-driven adaptive learning platform using short-form nature-based media.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-full font-nunito">{children}</body>
    </html>
  );
}
