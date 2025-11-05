"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Trash2,
  Edit3,
  Check,
  X,
  PlusCircle,
  Car,
  Clock,
  Loader2,
} from "lucide-react";

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  kmStart: number;
  lastUpdate?: { seconds: number };
}

interface Route {
  id: string;
  vehicle: string;
  status: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [kmStart, setKmStart] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editModel, setEditModel] = useState("");
  const [editPlate, setEditPlate] = useState("");
  const [editKmStart, setEditKmStart] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Carrega veículos e status de rotas
  async function loadVehicles() {
    setLoading(true);
    const vSnap = await getDocs(collection(db, "vehicles"));
    const rSnap = await getDocs(collection(db, "routes"));

    const vehiclesData = vSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Vehicle[];

    const routesData = rSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Route[];

    setVehicles(vehiclesData);
    setRoutes(routesData);
    setLoading(false);
  }

  // 🔹 Adicionar novo veículo
  async function addVehicle(e: any) {
    e.preventDefault();
    if (!model || !plate || !kmStart) return alert("Preencha todos os campos!");
    setSaving(true);
    try {
      await addDoc(collection(db, "vehicles"), {
        model,
        plate,
        kmStart: parseFloat(kmStart),
        lastUpdate: new Date(),
      });
      setModel("");
      setPlate("");
      setKmStart("");
      loadVehicles();
    } finally {
      setSaving(false);
    }
  }

  // 🔹 Remover veículo
  async function removeVehicle(id: string) {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;
    await deleteDoc(doc(db, "vehicles", id));
    loadVehicles();
  }

  // 🔹 Salvar edição
  async function saveEdit(id: string) {
    if (!editModel || !editPlate || !editKmStart) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "vehicles", id), {
        model: editModel,
        plate: editPlate,
        kmStart: parseFloat(editKmStart),
        lastUpdate: new Date(),
      });
      setEditingId(null);
      loadVehicles();
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  // 🔹 Formatar data
  function formatTimestamp(timestamp?: { seconds: number }) {
    if (!timestamp) return "-";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 🔹 Checar se veículo está em rota
  function getVehicleStatus(vehicle: Vehicle) {
    const active = routes.find(
      (r) => r.vehicle === `${vehicle.model} - ${vehicle.plate}` && r.status === "em-andamento"
    );
    return active ? "Em rota" : "Disponível";
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Carregando veículos...
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Car className="text-yellow-500" /> Veículos
        </h1>
        <p className="text-gray-600">
          Controle e acompanhe os veículos cadastrados no{" "}
          <strong>GrupoMM</strong>.
        </p>
      </div>

      {/* Formulário */}
      <form
        onSubmit={addVehicle}
        className="bg-black text-white p-6 rounded-lg grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Modelo do veículo"
          className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
        />
        <input
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="Placa (Ex: ABC-1234)"
          className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
        />
        <input
          value={kmStart}
          onChange={(e) => setKmStart(e.target.value)}
          placeholder="Km Atual"
          type="number"
          className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-500 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded px-4 py-2 flex items-center justify-center gap-2 transition-all"
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
              <th className="py-3 px-4 text-left">Modelo</th>
              <th className="py-3 px-4 text-left">Placa</th>
              <th className="py-3 px-4 text-left">Km Atual</th>
              <th className="py-3 px-4 text-left">Situação</th>
              <th className="py-3 px-4 text-left">Última Atualização</th>
              <th className="py-3 px-4 text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr
                key={v.id}
                className="border-b hover:bg-gray-50 transition duration-100"
              >
                <td className="py-3 px-4">
                  {editingId === v.id ? (
                    <input
                      className="border rounded px-2 py-1 w-full bg-black text-yellow-400"
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                    />
                  ) : (
                    v.model
                  )}
                </td>
                <td className="py-3 px-4">
                  {editingId === v.id ? (
                    <input
                      className="border rounded px-2 py-1 w-full bg-black text-yellow-400"
                      value={editPlate}
                      onChange={(e) => setEditPlate(e.target.value)}
                    />
                  ) : (
                    v.plate
                  )}
                </td>
                <td className="py-3 px-4">
                  {editingId === v.id ? (
                    <input
                      className="border rounded px-2 py-1 w-full bg-black text-yellow-400"
                      type="number"
                      value={editKmStart}
                      onChange={(e) => setEditKmStart(e.target.value)}
                    />
                  ) : (
                    `${v.kmStart?.toLocaleString("pt-BR")} km`
                  )}
                </td>
                <td className="py-3 px-4">
                  {getVehicleStatus(v) === "Em rota" ? (
                    <span className="text-green-600 font-semibold">
                      ● Em rota
                    </span>
                  ) : (
                    <span className="text-gray-500 font-medium">
                      ○ Disponível
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {v.lastUpdate ? formatTimestamp(v.lastUpdate) : "-"}
                </td>
                <td className="py-3 px-4 text-center">
                  {editingId === v.id ? (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => saveEdit(v.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(v.id);
                          setEditModel(v.model);
                          setEditPlate(v.plate);
                          setEditKmStart(v.kmStart?.toString() || "");
                        }}
                        className="text-yellow-500 hover:text-yellow-600"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => removeVehicle(v.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vehicles.length === 0 && (
        <p className="text-gray-500 text-sm text-center">
          Nenhum veículo cadastrado ainda.
        </p>
      )}
    </div>
  );
}