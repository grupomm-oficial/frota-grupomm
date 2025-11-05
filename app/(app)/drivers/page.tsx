"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { PlusCircle, Edit3, Trash2, Check, X } from "lucide-react";

interface Driver {
  id?: string;
  name: string;
  licenseNumber: string;
  phone: string;
  category: string;
  createdAt?: any;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Driver | null>(null);

  const [newDriver, setNewDriver] = useState({
    name: "",
    licenseNumber: "",
    phone: "",
    category: "",
  });

  // 🔹 Carrega motoristas
  async function loadDrivers() {
    const snap = await getDocs(
      query(collection(db, "drivers"), orderBy("createdAt", "desc"))
    );
    setDrivers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Driver) })));
    setLoading(false);
  }

  // 🔹 Adiciona novo motorista
  async function handleAddDriver(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await addDoc(collection(db, "drivers"), {
        ...newDriver,
        createdAt: serverTimestamp(),
      });
      setNewDriver({ name: "", licenseNumber: "", phone: "", category: "" });
      await loadDrivers();
    } catch (err) {
      console.error("Erro ao adicionar motorista:", err);
      alert("Erro ao cadastrar motorista.");
    } finally {
      setCreating(false);
    }
  }

  // 🔹 Iniciar edição
  function startEdit(d: Driver) {
    setEditingId(d.id ?? null);
    setEditData({ ...d });
  }

  // 🔹 Salvar edição
  async function saveEdit() {
    if (!editData || !editData.id) return;
    try {
      // Evita salvar o id dentro do documento
      const { id, ...payload } = editData;
      await updateDoc(doc(db, "drivers", id), payload as Omit<Driver, "id">);
      setEditingId(null);
      setEditData(null);
      await loadDrivers();
    } catch (err) {
      console.error("Erro ao salvar alterações:", err);
      alert("Não foi possível atualizar o motorista.");
    }
  }

  // 🔹 Excluir motorista
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;
    await deleteDoc(doc(db, "drivers", id));
    await loadDrivers();
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  if (loading) return <p>Carregando motoristas...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">🚘 Motoristas</h1>
      <p className="text-gray-600">
        Cadastre, edite e gerencie os condutores da frota do <strong>GrupoMM</strong>.
      </p>

      {/* 🔸 Formulário de cadastro */}
      <form
        onSubmit={handleAddDriver}
        className="bg-black text-white p-6 rounded-lg grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <input
          value={newDriver.name}
          onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
          placeholder="Nome completo"
          required
          className="border border-gray-700 rounded px-3 py-2 text-yellow-400 bg-black placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
        />
        <input
          value={newDriver.licenseNumber}
          onChange={(e) =>
            setNewDriver({ ...newDriver, licenseNumber: e.target.value })
          }
          placeholder="CNH"
          required
          className="border border-gray-700 rounded px-3 py-2 text-yellow-400 bg-black placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
        />
        <input
          value={newDriver.phone}
          onChange={(e) =>
            setNewDriver({ ...newDriver, phone: e.target.value })
          }
          placeholder="Telefone"
          className="border border-gray-700 rounded px-3 py-2 text-yellow-400 bg-black placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
        />
        <input
          value={newDriver.category}
          onChange={(e) =>
            setNewDriver({ ...newDriver, category: e.target.value })
          }
          placeholder="Categoria (Ex: B, D, E)"
          className="border border-gray-700 rounded px-3 py-2 text-yellow-400 bg-black placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded px-4 py-2 flex items-center justify-center gap-2 transition-all col-span-1 sm:col-span-2 lg:col-span-1"
        >
          <PlusCircle size={18} />
          {creating ? "Cadastrando..." : "Adicionar"}
        </button>
      </form>

      {/* 🔸 Tabela de motoristas */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-yellow-400 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 text-left">Nome</th>
              <th className="py-3 px-4 text-left">CNH</th>
              <th className="py-3 px-4 text-left">Telefone</th>
              <th className="py-3 px-4 text-left">Categoria</th>
              <th className="py-3 px-4 text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-b hover:bg-gray-50">
                {editingId === d.id ? (
                  <>
                    <td className="py-3 px-4">
                      <input
                        value={editData?.name ?? ""}
                        onChange={(e) =>
                          setEditData((prev) =>
                            prev ? { ...prev, name: e.target.value } : prev
                          )
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        value={editData?.licenseNumber ?? ""}
                        onChange={(e) =>
                          setEditData((prev) =>
                            prev
                              ? { ...prev, licenseNumber: e.target.value }
                              : prev
                          )
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        value={editData?.phone ?? ""}
                        onChange={(e) =>
                          setEditData((prev) =>
                            prev ? { ...prev, phone: e.target.value } : prev
                          )
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        value={editData?.category ?? ""}
                        onChange={(e) =>
                          setEditData((prev) =>
                            prev ? { ...prev, category: e.target.value } : prev
                          )
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    </td>
                    <td className="py-3 px-4 text-center flex justify-center gap-2">
                      <button
                        onClick={saveEdit}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditData(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-4 font-medium">{d.name}</td>
                    <td className="py-3 px-4">{d.licenseNumber}</td>
                    <td className="py-3 px-4">{d.phone || "-"}</td>
                    <td className="py-3 px-4">{d.category || "-"}</td>
                    <td className="py-3 px-4 text-center flex justify-center gap-2">
                      <button
                        onClick={() => startEdit(d)}
                        className="text-yellow-500 hover:text-yellow-600"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => d.id && handleDelete(d.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}