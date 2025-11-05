"use client";
import Image from "next/image";
import LogoMM from "@/public/Logo Grupo MM.png";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-yellow-400 text-center px-6">
      {/* Logo do Grupo MM */}
      <div className="fade-in mb-6">
        <Image
          src={LogoMM}
          alt="Logo Grupo MM"
          width={180}
          height={180}
          className="mx-auto drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]"
          priority
        />
      </div>

      {/* Título */}
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
        Bem-vindo ao Sistema de Frota GrupoMM
      </h1>

      {/* Texto descritivo */}
      <p className="text-gray-300 text-lg max-w-2xl mb-10 leading-relaxed">
        Controle total sobre veículos, rotas e abastecimentos.  
        Gerencie com eficiência e acompanhe relatórios em tempo real.  
        <br />
        <span className="text-yellow-400 font-semibold">
          Tudo em um só lugar.
        </span>
      </p>

      {/* Botão */}
      <a
        href="/login"
        className="bg-yellow-400 text-black font-semibold rounded-lg px-8 py-3 text-lg hover:bg-yellow-500 transition-all duration-300 shadow-md hover:shadow-yellow-500/30"
      >
        Entrar no Sistema
      </a>

      {/* Rodapé */}
      <footer className="absolute bottom-6 text-xs text-gray-500">
        © {new Date().getFullYear()} GrupoMM — Todos os direitos reservados.
      </footer>
    </div>
  );
}