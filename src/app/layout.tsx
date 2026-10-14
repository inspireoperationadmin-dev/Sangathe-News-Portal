import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@/components/google-analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Content comes from the database and is edited in the admin panel. Cloudflare Workers
// has no ISR cache configured, so pages are rendered per request to avoid stale content.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "சங்கதி | Sangathe News", template: "%s | Sangathe" },
  description: "Sangathe digital news and professional newsroom platform.",
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ta"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<GoogleAnalytics/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"NewsMediaOrganization",name:"சங்கதி",alternateName:"Sangathe Media",url:process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000",logo:`${process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"}/logo.svg`,email:"news@sangathe.com"})}}/></body>
    </html>
  );
}
