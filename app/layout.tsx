import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "数秘術計算",
  description: "Numerology Calculator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-screen
          text-slate-900
          font-normal
          sm:subpixel-antialiased
        `}
      >
        <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-10">
          <div className="mx-auto max-w-screen-xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
