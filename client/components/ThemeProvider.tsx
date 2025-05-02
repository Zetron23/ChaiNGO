// components/ThemeProvider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Wrap the NextThemesProvider around the application children
  // attribute="class" enables class-based dark mode (used by Tailwind)
  // defaultTheme="system" uses the user's system preference initially
  // enableSystem allows switching to the system preference
  // disableTransitionOnChange prevents theme change flashes
  return (
    <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
