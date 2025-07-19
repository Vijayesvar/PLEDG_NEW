import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains_mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Pledg | Login",
  description: "Pledg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GoogleOAuthProvider clientId={process.env.PUBLIC_GOOGLE_CLIENT_ID || '684364070442-hbm8s3f0uukfs9r023jr1o05dtcedgvl.apps.googleusercontent.com'}>
      <main className={`${inter.variable} ${jetbrains_mono.variable} antialiased`}>        
        {children}
      </main>
    </GoogleOAuthProvider>
  );
}
