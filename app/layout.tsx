import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worldwide Kids",
  description: "Meet a new country, and a new friend, a few times a week.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
