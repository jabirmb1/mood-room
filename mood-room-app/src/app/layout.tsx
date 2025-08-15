import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import NavBar from "@/components/layout/NavBar";
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mood Rooms",
  description: "Generate 3d mood roms base on AI interpretation of human input",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider 
        attribute="class"
        defaultTheme="system"
        enableSystem
        >
          <NavBar />
          {/* main content area has some side margins for better readability */}
          <main className="flex-grow w-[90vw] m-auto">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
