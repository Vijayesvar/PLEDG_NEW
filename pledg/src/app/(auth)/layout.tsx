import { Inter, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains_mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Toaster richColors />
      <main className={`${inter.variable} ${jetbrains_mono.variable} antialiased`}>
        {children}
      </main>
    </>
  );
}
