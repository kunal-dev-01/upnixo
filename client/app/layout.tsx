import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Providers } from "./provider";
import { AppToaster } from "@/utils/app-toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upnixo | High-Performance Engineering",
  description:
    "Scalable Infrastructure, Custom Webhooks, and Real-time Architectures.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>{children}</Providers>
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
