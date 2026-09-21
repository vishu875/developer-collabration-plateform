import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "DevConnect — AI-Powered Developer Collaboration",
    template: "%s | DevConnect",
  },
  description:
    "Find the right collaborators, analyze skills with AI, and build amazing projects together. DevConnect uses advanced AI to match developers with the perfect team.",
  keywords: [
    "developer collaboration",
    "team matching",
    "AI",
    "GitHub",
    "projects",
    "skills",
    "open source",
  ],
  authors: [{ name: "DevConnect" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="relative min-h-screen flex flex-col bg-gray-950 text-gray-100">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
