// src/app/frame/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Memory Matching Game Frame</title>
    
    <!-- Open Graph -->
    <meta property="og:title" content="Memory Matching Game" />
    <meta property="og:description" content="Mini game tri nho vui nhon, choi nhanh trong Farcaster feed" />
    <meta property="og:image" content="https://memory-matching-game-self.vercel.app/og-image.png" />

    <!-- Farcaster Frame -->
    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="https://memory-matching-game-self.vercel.app/splash.png" />
    <meta name="fc:frame:button:1" content="🎮 Play Now" />
    <meta name="fc:frame:button:1:action" content="link" />
    <meta name="fc:frame:button:1:target" content="https://memory-matching-game-self.vercel.app" />
  </head>
  <body>
    <h1>Memory Matching Game Frame</h1>
    <p>If you see this, the frame endpoint is working!</p>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}