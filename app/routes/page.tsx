"use client";
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Edit3, Trash2, Check, X } from "lucide-react";

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  kmStart?: number;
}

interface Driver {
  id: string;
  name: string;
}

interface Route {
  id: string;
  vehicle: string;
  driver: string;
  routeName: string;
  kmStart: number;
  kmEnd: number;
  distance: number;
  date: string;
  createdAt?: any;
}

export default function RoutesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  // Campos do formulário
  const [vehicle, setVehicle] = useState("");
  const [driver, setDriver] = useState("");
  const [newDriver, setNewDriver] = useState("");
  const [routeName, setRouteName] = useState("");
  const [kmStart, setKmStart] = useState("");
  const [kmEnd, setKmEnd] = useState("");
  const [date, setDate] = useState("");

  // Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    vehicle: "",
    driver: "",
    routeName: "",
    kmStart: "",
    kmEnd: "",
    distance: "",
    date: "",
  });

  // 🔹 Carregar dados iniciais
  async function loadData() {
    const vehiclesSnap = await getDocs(collection(db, "vehicles"));
    const driversSnap = await getDocs(collection(db, "drivers"));
    const routesSnap = await getDocs(
      query(collection(db, "routes"), orderBy("createdAt", "desc"))
    );

    setVehicles(
      vehiclesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Vehicle[]
    );
    setDrivers(
      driversSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Driver[]
    );
    setRoutes(
      routesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Route[]
    );
  }

  // 🔹 Adicionar novo motorista, se não existir
  async function ensureDriverExists(name: string) {
    const exists = drivers.find(
      (d) => d.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (!exists) {
      await addDoc(collection(db, "drivers"), { name });
      loadData();
    }
  }

  // 🔹 Quando o usuário escolhe o veículo → preencher km inicial automaticamente
  useEffect(() => {
    if (!vehicle) return;
    const selected = vehicles.find(
      (v) => `${v.model} - ${v.plate}` === vehicle
    );
    if (selected && selected.kmStart !== undefined) {
      setKmStart(selected.kmStart.toString());
    } else {
      setKmStart("");
    }
  }, [vehicle, vehicles]);

  // 🔹 Registrar nova rota e atualizar km do veículo
  async function addRoute(e: any) {
    e.preventDefault();
    if (!vehicle || !(driver || newDriver) || !routeName || !kmStart || !kmEnd || !date)
      return;

    const kmStartValue = parseFloat(kmStart);
    const kmEndValue = parseFloat(kmEnd);
    const distance = kmEndValue - kmStartValue;
    const finalDriver = driver || newDriver;

    await ensureDriverExists(finalDriver);

    // Salvar rota
    await addDoc(collection(db, "routes"), {
      vehicle,
      driver: finalDriver,
      routeName,
      kmStart: kmStartValue,
      kmEnd: kmEndValue,
      distance,
      date,
      createdAt: serverTimestamp(),
    });

    // Atualizar veículo
    const vehiclesSnap = await getDocs(collection(db, "vehicles"));
    const vehicleDoc = vehiclesSnap.docs.find((d) => {
      const data = d.data() as any;
      return `${data.model} - ${data.plate}` === vehicle;
    });

    if (vehicleDoc) {
      const vRef = doc(db, "vehicles", vehicleDoc.id);
      await updateDoc(vRef, {
        kmStart: kmEndValue,
        lastUpdate: serverTimestamp(),
      });
    }

    // Reset
    setVehicle("");
    setDriver("");
    setNewDriver("");
    setRouteName("");
    setKmStart("");
    setKmEnd("");
    setDate("");
    loadData();
  }

  // 🔹 Excluir rota
  async function deleteRoute(id: string) {
    await deleteDoc(doc(db, "routes", id));
    loadData();
  }

  // 🔹 Iniciar edição
  function startEdit(r: Route) {
    setEditingId(r.id);
    setEditData({
      vehicle: r.vehicle,
      driver: r.driver,
      routeName: r.routeName,
      kmStart: r.kmStart.toString(),
      kmEnd: r.kmEnd.toString(),
      distance: r.distance.toString(),
      date: r.date,
    });
  }

  // 🔹 Salvar edição
  async function saveEdit(id: string) {
    const kmStartValue = parseFloat(editData.kmStart);
    const kmEndValue = parseFloat(editData.kmEnd);
    const distance = kmEndValue - kmStartValue;

    await updateDoc(doc(db, "routes", id), {
      ...editData,
      kmStart: kmStartValue,
      kmEnd: kmEndValue,
      distance,
    });

    setEditingId(null);
    loadData();
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">🛣️ Rotas da Frota</h1>
      <p className="text-gray-600">
        Registre as rotas realizadas pelos veículos do <strong>GrupoMM</strong>.
      </p>

      {/* 🔸 Formulário */}
      <form
        onSubmit={addRoute}
        className="bg-black text-white p-6 rounded-lg grid sm:grid-cols-2 lg:grid-cols-6 gap-4"
      >
        {/* Veículo */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Veículo</label>
          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          >
            <option value="">Selecione o veículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={`${v.model} - ${v.plate}`}>
                {v.model} — {v.plate} ({v.kmStart?.toLocaleString("pt-BR")} km)
              </option>
            ))}
          </select>
        </div>

        {/* Motorista */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Motorista</label>
          <select
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          >
            <option value="">Selecione ou cadastre</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          {!driver && (
            <input
              value={newDriver}
              onChange={(e) => setNewDriver(e.target.value)}
              placeholder="Novo motorista"
              className="mt-2 border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
            />
          )}
        </div>

        {/* Nome da Rota */}
        <div className="flex flex-col gap-1 lg:col-span-2">
          <label className="text-sm text-gray-300">Rota</label>
          <input
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="Ex: Cedral → Mirinzal"
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>

        {/* Km Inicial (automático) */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Km Inicial (auto)</label>
          <input
            value={kmStart}
            disabled
            type="number"
            placeholder="Selecionar veículo"
            className="border border-gray-700 rounded px-3 py-2 bg-gray-800 text-yellow-400 cursor-not-allowed"
          />
        </div>

        {/* Km Final */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Km Final</label>
          <input
            value={kmEnd}
            onChange={(e) => setKmEnd(e.target.value)}
            type="number"
            placeholder="Ex: 12680"
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>

        {/* Data */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Data</label>
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="lg:col-span-6 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded px-4 py-2 w-full mt-2"
        >
          Registrar Rota
        </button>
      </form>

      {/* 🔸 Tabela */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-yellow-400 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 text-left">Veículo</th>
              <th className="py-3 px-4 text-left">Motorista</th>
              <th className="py-3 px-4 text-left">Rota</th>
              <th className="py-3 px-4 text-left">Km Inicial</th>
              <th className="py-3 px-4 text-left">Km Final</th>
              <th className="py-3 px-4 text-left">Distância</th>
              <th className="py-3 px-4 text-left">Data</th>
              <th className="py-3 px-4 text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50 transition duration-100">
                <td className="py-3 px-4">{r.vehicle}</td>
                <td className="py-3 px-4">{r.driver}</td>
                <td className="py-3 px-4">{r.routeName}</td>
                <td className="py-3 px-4">{r.kmStart}</td>
                <td className="py-3 px-4">{r.kmEnd}</td>
                <td className="py-3 px-4">{r.distance} km</td>
                <td className="py-3 px-4">{r.date}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => startEdit(r)}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => deleteRoute(r.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {routes.length === 0 && (
        <p className="text-gray-500 text-sm text-center">
          Nenhuma rota registrada ainda.
        </p>
      )}
    </div>
  );
}