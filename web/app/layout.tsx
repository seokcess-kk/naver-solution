import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naver Place Monitor",
  description: "네이버 플레이스 랭킹 자동 모니터링 솔루션",
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
