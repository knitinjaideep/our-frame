import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { ConditionalShell } from "@/components/layout/conditional-shell";
import { AuthGate } from "@/components/auth/auth-gate";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Our Frame",
  description: "The family memory vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${playfairDisplay.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <AuthGate>
            <ConditionalShell>
              {children}
            </ConditionalShell>
          </AuthGate>
        </Providers>
      </body>
    </html>
  );
}
