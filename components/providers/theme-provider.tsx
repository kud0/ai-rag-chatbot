'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

/**
 * Theme provider component that wraps the application.
 * Uses next-themes for dark/light mode switching.
 *
 * Features:
 * - Automatic theme detection from system preferences
 * - Persistent theme selection
 * - No flash of unstyled content
 * - Support for multiple themes
 *
 * @param props - Theme provider props
 * @param props.children - Child components
 * @param props.attribute - HTML attribute to set (default: 'class')
 * @param props.defaultTheme - Default theme (default: 'system')
 * @param props.enableSystem - Enable system theme detection (default: true)
 * @param props.disableTransitionOnChange - Disable transitions when changing theme (default: false)
 *
 * @example
 * ```tsx
 * import { ThemeProvider } from '@/components/providers/theme-provider';
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="en" suppressHydrationWarning>
 *       <body>
 *         <ThemeProvider>{children}</ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
