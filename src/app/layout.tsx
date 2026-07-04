import type { Metadata } from "next";
import "./globals.css";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

export const metadata: Metadata = {
  title: {
    default: "AlmiKorean | Honest TOPIK Practice, Levels 1–6",
    template: "%s · AlmiKorean",
  },
  description:
    "Practise real TOPIK task formats for both tracks — TOPIK I (Listening + Reading) and TOPIK II (Listening + Writing + Reading). Total-based level estimates, no section floors, Writing labelled an estimate. Never a made-up official score.",
  metadataBase: new URL("https://almikorean.almiworld.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <GlobalHeader />
        {children}
        <GlobalFooter />
      </body>
    </html>
  );
}
