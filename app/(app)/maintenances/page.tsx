"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Wrench,
  Check,
  X,
  Trash2,
  Edit3,
  PlusCircle,
  Loader2,
} from "lucide-react";

interface Maintenance {
  id?: string;
  vehicle: string;
  type: string;
  km: number;
  cost: number;
  notes?: string;
  status: string;
  date: string;
  createdAt?: any;
}

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  kmStart: number;
}

export default function MaintenancesPage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Maintenance>>({}); // 🔧 aqui está o segredo

  const [newMaintenance, setNewMaintenance] = useState({
    vehicle: "",
    type: "",
    km: "",
    cost: "",
    notes: "",
    status: "concluída",
    date: "",
  });

  async function loadData() {
    setLoading(true);
    const vSnap = await getDocs(collection(db, "vehicles"));
    const mSnap = await getDocs(
      query(collection(db, "maintenances"), orderBy("createdAt", "desc"))
    );
    setVehicles(vSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Vehicle[]);
    setMaintenances(mSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Maintenance[]);
    setLoading(false);
  }

  async function handleAdd(e: any) {
    e.preventDefault();
    if (!newMaintenance.vehicle || !newMaintenance.type || !newMaintenance.date) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "maintenances"), {
        ...newMaintenance,
        km: parseFloat(newMaintenance.km) || 0,
        cost: parseFloat(newMaintenance.cost) || 0,
        createdAt: serverTimestamp(),
      });

      setNewMaintenance({
        vehicle: "",
        type: "",
        km: "",
        cost: "",
        notes: "",
        status: "concluída",
        date: "",
      });

      loadData();
    } catch (err) {
      console.error("Erro ao adicionar manutenção:", err);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(m: Maintenance) {
    setEditingId(m.id || null);
    setEditData({ ...m });
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, "maintenances", editingId), editData);
      setEditingId(null);
      setEditData({});
      loadData();
    } catch (err) {
      console.error("Erro ao salvar edição:", err);
      alert("Não foi possível salvar a edição.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir esta manutenção?")) return;
    await deleteDoc(doc(db, "maintenances", id));
    loadData();
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Carregando manutenções...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="text-yellow-500" /> Manutenções
        </h1>
        <p className="text-gray-600">
          Registre e acompanhe as manutenções dos veículos do{" "}
          <strong>GrupoMM</strong>.
        </p>
      </div>

      {/* Formulário */}
      <form
        onSubmit={handleAdd}
        className="bg-black text-white p-6 rounded-lg grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <select
          value={newMaintenance.vehicle}
          onChange={(e) =>
            setNewMaintenance({ ...newMaintenance, vehicle: e.target.value })
          }
          className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400"
        >
          <option value="">Selecione o veículo</option>
          {vehicles.map((v) => (
            <option key={v.id} value={`${v.model} - ${v.plate}`}>
              {v.model} — {v.plate}
            </option>
          ))}
        </select>

        <input
          value={newMaintenance.type}
          onChange={(e) =>
            setNewMaintenance({ ...newMaintenance, type: e.target.value })
          }
          placeholder="Tipo de manutenção"
          className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400"
        />

        <input
          type="number"
          value={newMaintenance.km}
          onChange={(e) =>
            setNewMaintenance({ ...newMaintenance, km: e.target.value })
          }
          placeholder="Km atual"
          className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400"
        />

        <input
          type="number"
          value={newMaintenance.cost}
          onChange={(e) =>
            setNewMaintenance({ ...newMaintenance, cost: e.target.value })
          }
          placeholder="Custo (R$)"
          className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400"
        />

        <input
          type="date"
          value={newMaintenance.date}
          onChange={(e) =>
            setNewMaintenance({ ...newMaintenance, date: e.target.value })
          }
          className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400"
        />

        <textarea
          value={newMaintenance.notes}
          onChange={(e) =>
            setNewMaintenance({ ...newMaintenance, notes: e.target.value })
          }
          placeholder="Observações"
          className="lg:col-span-5 border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400"
        />

        <button
          type="submit"
          disabled={saving}
          className="lg:col-span-5 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded px-4 py-2 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <PlusCircle size={18} /> Adicionar
            </>
          )}
        </button>
      </form>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-yellow-400 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 text-left">Veículo</th>
              <th className="py-3 px-4 text-left">Tipo</th>
              <th className="py-3 px-4 text-left">Km</th>
              <th className="py-3 px-4 text-left">Custo</th>
              <th className="py-3 px-4 text-left">Data</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Observações</th>
              <th className="py-3 px-4 text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {maintenances.map((m) => (
              <tr
                key={m.id}
                className="border-b hover:bg-gray-50 transition duration-100"
              >
                <td className="py-3 px-4">{m.vehicle}</td>
                <td className="py-3 px-4">{m.type}</td>
                <td className="py-3 px-4">{m.km?.toLocaleString("pt-BR")} km</td>
                <td className="py-3 px-4">
                  {m.cost ? `R$ ${m.cost.toFixed(2)}` : "-"}
                </td>
                <td className="py-3 px-4">{m.date}</td>
                <td className="py-3 px-4 capitalize">
                  {m.status === "pendente" ? (
                    <span className="text-red-500 font-semibold">Pendente</span>
                  ) : (
                    <span className="text-green-600 font-semibold">Concluída</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-700">{m.notes || "-"}</td>
                <td className="py-3 px-4 text-center flex justify-center gap-2">
                  <button
                    onClick={() => startEdit(m)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id!)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {maintenances.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          Nenhuma manutenção registrada ainda.
        </p>
      )}
    </div>
  );
}