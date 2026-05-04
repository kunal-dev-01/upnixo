import type { Metadata } from "next";
// @ts-ignore: side-effect CSS import handled by Next.js
import "./globals.css";

export const metadata: Metadata = {
  title: "Upnixo | High-Performance Engineering",
  description: "Scalable Infrastructure, Custom Webhooks, and Real-time Architectures.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' }, 
      { url: '/favicon.svg', type: 'image/svg+xml' }, 
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}