import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evident | Jobs with evidence",
  description: "Turn your resume into proof.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
