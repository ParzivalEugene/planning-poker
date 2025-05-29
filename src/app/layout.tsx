import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider, UserProvider } from "@/contexts";
import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Planning Poker",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body>
        <I18nProvider>
          <TRPCReactProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <UserProvider>{children}</UserProvider>
              <Toaster
                position="bottom-right"
                toastOptions={{
                  className: "mobile-toast",
                }}
                className="mobile-toaster"
              />
            </ThemeProvider>
          </TRPCReactProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
