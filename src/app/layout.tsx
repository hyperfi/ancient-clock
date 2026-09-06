import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-sans-devanagari",
  subsets: ["devanagari", "latin"],
});

export const metadata: Metadata = {
  title: "Ghaṭikā — Ancient Indian Time & Astronomy Lab",
  description: "An interactive laboratory for ancient Indian timekeeping and astronomy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansDevanagari.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#FEFDF5" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
