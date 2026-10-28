import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import React from "react";
import { cn } from "@/lib/utils";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: RootLayoutProps) => {
  return (
    <div className={cn("min-h-screen", geistSans.variable, geistMono.variable)}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="h-full">{children}</div>
      </ThemeProvider>
    </div>
  );
};

export default AppLayout;
