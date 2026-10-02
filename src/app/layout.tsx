import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/components/provider";
const geist = Geist({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
