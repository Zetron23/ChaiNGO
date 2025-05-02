    // app/layout.tsx
    import type { Metadata } from "next";
    import { Inter } from "next/font/google";
    import "./globals.css";
    import { cn } from "@/lib/utils";
    import { Toaster as SonnerToaster } from "@/components/ui/sonner";
    import { ThemeProvider } from "@/components/ThemeProvider";
    import { ThemeToggle } from "@/components/ThemeToggle"; // Keep this if ThemeToggle is used here, otherwise remove

    const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

    export const metadata: Metadata = {
      title: "ChainGo - Welcome",
      description: "Platform for Admins, Donors, and NGOs",
    };

    export default function RootLayout({
      children,
    }: Readonly<{
      children: React.ReactNode;
    }>) {
      return (
        // Ensure no leading/trailing spaces or newlines within the <html> tag itself
        <html lang="en" suppressHydrationWarning>
          {/* Ensure <head /> is directly adjacent or on the next line without leading space */}
          <head />
          {/* Ensure <body> is directly adjacent or on the next line without leading space */}
          <body
            className={cn(
              "min-h-screen bg-background font-sans antialiased",
              inter.variable
            )}
          >
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
              {/* Ensure no leading whitespace before <main> or other direct children */}
              {/* The <main> tag was removed here as layouts should handle structure */}
              {children}
              {/* Theme Toggle was moved to Navbar/Layouts - remove if not needed globally */}
              {/* <div className="fixed bottom-5 right-5 z-50">
                <ThemeToggle />
              </div> */}
              <SonnerToaster richColors />
            </ThemeProvider>
          </body>
        </html>
      );
    }
    