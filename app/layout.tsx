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
          subpixel-antialiased
          min-h-screen
          text-slate-800
        `}
      >
        {/* 背景グラデーション */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-pink-50 via-white to-amber-50" />

        {/* メインレイアウト */}
        <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-10">
          <div className="mx-auto max-w-screen-xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
