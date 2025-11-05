"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import {
  LayoutDashboard,
  Car,
  Map,
  Fuel,
  FileText,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  IdCard,
  Wrench,
} from "lucide-react";
import LogoMM from "@/public/Logo Grupo MM.png";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAdmin =
    userData?.role === "admin" || userData?.permissions?.manageUsers === true;

  // 🔹 Links laterais (com a nova aba de Manutenções)
  const links: Array<{ href: string; label: string; icon: React.ComponentType<any> }> = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vehicles", label: "Veículos", icon: Car },
    { href: "/maintenances", label: "Manutenções", icon: Wrench },
    { href: "/drivers", label: "Motoristas", icon: IdCard },
    { href: "/routes", label: "Rotas", icon: Map },
    { href: "/refuels", label: "Abastecimentos", icon: Fuel },
    { href: "/reports", label: "Relatórios", icon: FileText },
  ];

  if (isAdmin) {
    links.push({ href: "/users", label: "Usuários", icon: Users });
  }

  const handleLogout = async () => {
    try {
      setShowConfirm(false);
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Erro ao sair:", err);
      alert("Não foi possível encerrar a sessão. Tente novamente.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* SIDEBAR FIXA */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-black text-yellow-400 flex flex-col justify-between shadow-xl fixed h-screen transition-all duration-300 z-50`}
      >
        {/* TOPO */}
        <div>
          <div className="flex flex-col items-center justify-center py-6 border-b border-gray-800 relative">
            <Image
              src={LogoMM}
              alt="Logo GrupoMM"
              width={collapsed ? 40 : 100}
              height={collapsed ? 40 : 100}
              className="transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]"
              priority
            />
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute right-3 top-3 text-yellow-400 hover:text-yellow-300"
              aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* LINKS */}
          <nav className="flex flex-col p-3 space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                    active
                      ? "bg-yellow-400 text-black font-semibold"
                      : "hover:bg-gray-900 hover:text-yellow-300"
                  }`}
                >
                  <Icon size={20} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RODAPÉ */}
        <footer className="p-4 border-t border-gray-800 text-center text-sm relative">
          <div className="flex flex-col items-center">
            {!collapsed && (
              <>
                <p className="text-yellow-400 font-semibold truncate">
                  {userData?.username || user?.email}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {userData?.role === "admin"
                    ? "Administrador"
                    : userData?.role === "manager"
                    ? "Gerente"
                    : "Usuário"}
                </p>
              </>
            )}

            <div className="flex items-center justify-center mt-2">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
              {!collapsed && <span className="text-gray-400 text-xs">Online</span>}
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              className="mt-4 flex items-center justify-center gap-2 w-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-white rounded-md py-2 transition-all font-semibold"
            >
              <LogOut size={18} />
              {!collapsed && "Sair"}
            </button>

            {/* Confirmação de logout */}
            {showConfirm && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-md">
                <p className="text-yellow-400 font-semibold text-lg mb-3">
                  Deseja realmente sair?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleLogout}
                    className="bg-yellow-400 text-black font-bold px-4 py-2 rounded hover:bg-yellow-300 transition"
                  >
                    Sim, sair
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="bg-gray-800 text-gray-300 px-4 py-2 rounded hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </footer>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main
        className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
          <span className="text-gray-600 text-sm">
            {userData?.username || user?.email}
          </span>
        </header>
        {children}
      </main>
    </div>
  );
}