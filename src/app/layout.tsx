import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FeedFlow - Feedback Simples para Estabelecimentos",
  description: "Colete feedback dos seus clientes de forma rapida, anonima e privada via QR Code.",
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
