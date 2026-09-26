import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const mincho = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["400", "600"],
  preload: false,
});

export const metadata: Metadata = {
  title: "あなたの潜在自己",
  description:
    "直感的な反応と、あとから語る言葉。そのズレから、まだ残っているものを見つめる。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} ${mincho.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
