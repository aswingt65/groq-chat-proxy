import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Groq Gateway — AI Chat Proxy",
  description:
    "Access Groq's lightning-fast AI models through a secure proxy. Bring your own API key and chat with state-of-the-art language models.",
  keywords: ["groq", "ai", "chat", "proxy", "llm", "api"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
