import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manabi — Tự học và luyện thi JLPT",
  description: "Học tiếng Nhật theo cấp JLPT, luyện tập và ôn lại kiến thức cần nhớ.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
