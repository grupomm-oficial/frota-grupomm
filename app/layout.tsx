import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Frota GrupoMM",
  description: "Sistema de Gerenciamento de Frota do GrupoMM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-100 text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}