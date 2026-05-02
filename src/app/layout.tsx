import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "DEAL - منصة التجارة والخدمات الجزائرية",
  description: "اشتري المنتجات، احجز الخدمات — كل شيء في مكان واحد",
  keywords: ["DEAL", "الجزائر", "تجارة", "خدمات", "منصة"],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} antialiased bg-background text-foreground font-[family-name:var(--font-cairo)]`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
