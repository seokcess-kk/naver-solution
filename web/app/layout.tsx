import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { AuthHydrationProvider } from "@/lib/providers/AuthHydrationProvider";
import { Toaster } from "sonner";

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
      <body>
        <QueryProvider>
          <AuthHydrationProvider>{children}</AuthHydrationProvider>
        </QueryProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
