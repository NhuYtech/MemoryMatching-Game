// src/app/frame/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Memory Matching Game</title>
    
    <!-- Open Graph -->
    <meta property="og:title" content="Memory Matching Game" />
    <meta property="og:description" content="Mini game trí nhớ vui nhộn, chơi nhanh trong Farcaster feed" />
    <meta property="og:image" content="https://memory-matching-game-self.vercel.app/og-image.png" />

    <!-- Farcaster Frame -->
    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="https://memory-matching-game-self.vercel.app/splash.png" />
    <meta name="fc:frame:button:1" content="Play Now" />
    <meta name="fc:frame:button:1:action" content="link" />
    <meta name="fc:frame:button:1:target" content="https://memory-matching-game-self.vercel.app" />
    <meta name="fc:frame:post_url" content="https://memory-matching-game-self.vercel.app/frame" />
  </head>
  <body>
    <h1>Memory Matching Game Frame</h1>
    <p>Frame is working! Button should appear in Farcaster.</p>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}