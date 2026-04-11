"use client";
import { ThemeProvider } from '@/context/ThemeContext';

export default function ClientLayout({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
