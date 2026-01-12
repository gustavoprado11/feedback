import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diz Aí - Feedback Simples para Estabelecimentos",
  description: "Colete feedback dos seus clientes de forma rápida, anônima e privada via QR Code.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
