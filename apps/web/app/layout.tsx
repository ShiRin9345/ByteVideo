import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";

import "@workspace/ui/globals.css";
import "./globals.css";
import { ThemeProvider } from "@/components/provider/theme-providers";
import { QueryProvider } from "@/components/provider/query-provider";
import { AuthProvider } from "@/features/auth";
import { Toaster } from "@workspace/ui/components/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Metadata } from "next";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});
export const metadata: Metadata = {
  title: "byteVideo",
  description: "byteVideo is a video management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable} overflow-x-hidden font-sans antialiased`}
      >
        <NuqsAdapter>
          <QueryProvider>
            <ThemeProvider>
              <AuthProvider>
                <Toaster />
                {children}
              </AuthProvider>
            </ThemeProvider>
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
