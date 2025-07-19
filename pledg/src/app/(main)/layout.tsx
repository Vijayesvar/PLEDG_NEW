import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/layout/header"
import "../globals.css";
import ThemeSwitcher from "@/components/ui/theme-switcher";
import Image from "next/image";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pledg | Home",
  description: "Pledge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${inter.variable} antialiased`}>
      <Header />
      <ProtectedRoute>
        <main className="pt-[6vh]">{children}</main>
        <footer className="w-full border-t border-[var(--border)] bg-secondary text-xs text-foreground flex items-center justify-between px-8 py-4 mt-8">
          <div className="flex items-center gap-2">
            <Image src="/pledg.svg" alt="Pledg Logo" width={24} height={24} className="inline-block" />
            <span className="font-semibold tracking-wide">Pledg</span>
            <span className="ml-4 text-[11px] text-[var(--subtext)]">© {new Date().getFullYear()}, Pledg</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
          </div>
        </footer>
      </ProtectedRoute>
    </div>
  );
}
