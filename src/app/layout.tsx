import Providers from "@/app/providers";
import PwaInstallPrompt from "@/components/pwa-install-prompt";
import { cn } from "@/utils/cn";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AcutePOS",
    template: "%s | AcutePOS",
  },
  description: "AcutePOS Reporting System.",
  applicationName: "AcutePOS",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.png", sizes: "48x48", type: "image/png" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AcutePOS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0F" },
  ],
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full overflow-hidden antialiased", inter.className)}
    >
      {/* Grammarly can inject body attributes before React hydrates. */}
      <body
        suppressHydrationWarning
        className="h-full overflow-hidden bg-background-gray-secondary_alt_2"
      >
        <ThemeProvider defaultTheme="system" enableSystem>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
        <PwaInstallPrompt />
        <Toaster />
      </body>
    </html>
  );
}
