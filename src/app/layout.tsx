import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/components/provider";
import { bootstrap } from "@/lib/data";
export const dynamic = "force-dynamic";
const geist = Geist({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initial = await bootstrap();
  return <html lang="vi" className={cn("font-sans", geist.variable)}><body><AppProvider key={`${initial.mode}-${initial.userId}`} initial={initial}>{children}</AppProvider><Toaster position="bottom-right" theme="light" /></body></html>;
}


