"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // busca o usuário pelo username
      const q = query(collection(db, "users"), where("username", "==", username));
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error("Usuário não encontrado");

      const userData = snapshot.docs[0].data() as any;
      if (!userData.email) throw new Error("E-mail não cadastrado para este usuário");

      await signInWithEmailAndPassword(auth, userData.email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Erro de login:", err.message);
      setError("Falha ao autenticar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="mb-6">
        <Image
          src="/Logo Grupo MM.png"
          alt="Logo Grupo MM"
          width={160}
          height={160}
          priority
          className="rounded-xl shadow-lg"
        />
      </div>

      <form
        onSubmit={handleLogin}
        className="bg-neutral-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-4 border border-neutral-800"
      >
        <h1 className="text-center text-2xl font-bold text-yellow-400">
          Sistema de Frota Grupo MM
        </h1>

        <input
          type="text"
          placeholder="Nome de usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-black border border-neutral-700 rounded px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-black border border-neutral-700 rounded px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none"
        />

        {error && <p className="text-red-500 text-center text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-md transition-all duration-200 shadow-md hover:shadow-yellow-500/40"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-xs text-center text-gray-500 mt-2">
          © {new Date().getFullYear()} Grupo MM — todos os direitos reservados
        </p>
      </form>
    </div>
  );
}