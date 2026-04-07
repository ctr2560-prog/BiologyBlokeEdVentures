import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
