import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Leonardo Services Dashboard",
  description: "Internal dashboard for service deployment monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <header className="bg-slate-900 text-white py-4 px-6 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Image
              src="/leonardo-logo-white-fix.svg"
              alt="Leonardo Logo"
              width={128}
              height={32}
            />
            <h1 className="text-xl font-semibold select-none">
              API Services Dashboard
            </h1>
            <nav className="flex space-x-4">
              <Link href="/" className="hover:text-blue-300 transition-colors">
                Services
              </Link>
            </nav>
          </div>
        </header>
        <main className="container mx-auto py-6 px-4">{children}</main>
      </body>
    </html>
  );
}
