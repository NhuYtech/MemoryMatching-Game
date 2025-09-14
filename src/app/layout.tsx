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
  title: "Memory Matching Game",
  description: "Mini game trí nhớ vui nhộn, chơi nhanh trong Farcaster feed",
  openGraph: {
    title: "Memory Matching Game",
    description: "Mini app game trí nhớ của Như Ý",
    url: "https://memory-matching-game-self.vercel.app",
    siteName: "Memory Matching Game",
    images: [
      {
        url: "https://memory-matching-game-self.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Memory Matching Game Preview",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memory Matching Game",
    description: "Mini app game trí nhớ của Như Ý",
    images: ["https://memory-matching-game-self.vercel.app/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}