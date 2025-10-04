import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ConditionalNavbar } from "@/components/conditional-navbar";
import { AIChatbot } from "@/components/ai-chatbot";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog App",
  description: "A modern blog application built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CopilotKit publicApiKey={process.env.NEXT_COPILOTKIT_PUBLIC_KEY}>
          <Providers>
            <div className="min-h-screen bg-background">
              <ConditionalNavbar />
              <AIChatbot />
              <main>{children}</main>
            </div>
          </Providers>
        </CopilotKit>
      </body>
    </html>
  );
}
