import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Sidebar } from "../components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Maremu - Gestão de Loja",
  description: "Sistema PWA de gestão para lojas de roupas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className={`${inter.className} flex h-screen overflow-hidden bg-gray-200`}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto padding-6">
          {children}
        </main>
      </div>
  );
}