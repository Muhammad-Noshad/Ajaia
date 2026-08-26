import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ajaia Assessment Starter",
  description: "A lightweight full-stack starter for the Ajaia assessment.",
};

// The root layout owns application-wide providers and infrastructure UI. Keeping
// the toaster here makes notifications available to future routes without adding
// a second provider to each feature boundary.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex h-full flex-col overflow-hidden">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
