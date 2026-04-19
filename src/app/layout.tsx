import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Let's Spotify - Learn Languages through Music",
  description: "Learn a new language by searching for songs and following along with synced lyrics and translations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
