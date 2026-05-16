import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fresher Jobs 2026",
  description: "Latest fresher job updates across India",
  
  verification: {
    google: "8gToMRLPSl3Uj0N4gF9wFBjbNdQKVB5QDn3KBIhygtg",
  },
};

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { SavedJobsProvider } from "@/lib/context/SavedJobsContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 font-sans">
        <SavedJobsProvider>
          <Header />
          <main className="flex-grow">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <Footer />
        </SavedJobsProvider>
      </body>
    </html>
  );
}