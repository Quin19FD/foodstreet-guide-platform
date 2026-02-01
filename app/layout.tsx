/**
 * Root Layout
 *
 * Main layout wrapper for the entire application.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodStreet Guide - Hướng dẫn ẩm thực đường phố",
  description: "Khám phá ẩm thực đường phố thông minh với QR Code & GPS",
  keywords: ["foodstreet", "ẩm thực", "đường phố", "QR Code", "GPS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
