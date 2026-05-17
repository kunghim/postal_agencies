import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "侨批书信",
  description: "复古侨批书信生成网站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
