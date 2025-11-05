"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/vehicles", label: "Veículos" },
    { href: "/routes", label: "Rotas" },
    { href: "/refuels", label: "Abastecimentos" },
    { href: "/reports", label: "Relatórios" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-bold text-yellow-400">🚗 Frota GrupoMM</h1>
          </div>

          <nav className="flex flex-col p-4 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? "active" : ""}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <footer className="p-4 border-t border-gray-800 text-center text-sm">
          <p className="text-yellow-400">{user?.email}</p>
          <button
            onClick={logout}
            className="text-red-400 hover:text-red-500 mt-2 text-sm"
          >
            Sair
          </button>
        </footer>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
          <span className="text-gray-600 text-sm">{user?.email}</span>
        </header>
        {children}
      </main>
    </div>
  );
}