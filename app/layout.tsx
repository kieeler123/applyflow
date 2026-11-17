import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplyFlow",
  description: "취업 준비를 체계적으로 관리하는 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
