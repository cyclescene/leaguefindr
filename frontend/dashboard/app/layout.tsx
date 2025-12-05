import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import SupabaseProvider from "@/context/SupabaseContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeagueFindr Dashboard",
  description: "Sports league management platform - Dashboard for organizing, managing, and submitting sports leagues",
  keywords: ["sports", "league", "management", "dashboard", "organizer"],
  authors: [{ name: "Recess Sports dba LeagueFindr" }],
  openGraph: {
    title: "LeagueFindr Dashboard",
    description: "Manage your sports leagues with LeagueFindr",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <SupabaseProvider>
            {children}
            <Toaster position="top-right" />
          </SupabaseProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
