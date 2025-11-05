"use client";
import { useEffect, useState } from "react";
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
import { Trash2, PlusCircle } from "lucide-react";

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  kmStart?: number;
}

interface Refuel {
  id: string;
  vehicle: string;
  kmCurrent: number;
  liters: number;
  pricePerL: number;
  totalPrice: number;
  station: string;
  store: string;
  date: string;
  createdAt?: any;
}

export default function RefuelsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [vehicle, setVehicle] = useState("");
  const [kmCurrent, setKmCurrent] = useState("");
  const [pricePerL, setPricePerL] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [station, setStation] = useState("");
  const [store, setStore] = useState("");
  const [date, setDate] = useState("");
  const [filterStore, setFilterStore] = useState("all");

  // 🔹 Carregar dados
  async function loadData() {
    const vSnap = await getDocs(collection(db, "vehicles"));
    const rSnap = await getDocs(query(collection(db, "refuels"), orderBy("createdAt", "desc")));

    setVehicles(vSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Vehicle[]);
    setRefuels(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Refuel[]);
  }

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Quando selecionar veículo → preencher km atual e data
  useEffect(() => {
    if (!vehicle) {
      setKmCurrent("");
      return;
    }

    const selected = vehicles.find(
      (v) => `${v.model} - ${v.plate}` === vehicle
    );
    if (selected && selected.kmStart) {
      setKmCurrent(selected.kmStart.toString());
    }

    // Data automática
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, [vehicle, vehicles]);

  // 🔹 Registrar abastecimento
  async function addRefuel(e: any) {
    e.preventDefault();
    if (!vehicle || !kmCurrent || !pricePerL || !totalPrice || !station || !store || !date) return;

    const kmValue = parseFloat(kmCurrent);
    const priceValue = parseFloat(pricePerL);
    const totalValue = parseFloat(totalPrice);
    const litersValue = totalValue / priceValue;

    await addDoc(collection(db, "refuels"), {
      vehicle,
      kmCurrent: kmValue,
      liters: litersValue,
      pricePerL: priceValue,
      totalPrice: totalValue,
      station,
      store,
      date,
      createdAt: serverTimestamp(),
    });

    // Atualizar veículo com novo km
    const vSnap = await getDocs(collection(db, "vehicles"));
    const vehicleDoc = vSnap.docs.find((d) => {
      const data = d.data() as any;
      return `${data.model} - ${data.plate}` === vehicle;
    });
    if (vehicleDoc) {
      const vRef = doc(db, "vehicles", vehicleDoc.id);
      await updateDoc(vRef, {
        kmStart: kmValue,
        lastUpdate: serverTimestamp(),
      });
    }

    // Resetar campos
    setVehicle("");
    setKmCurrent("");
    setPricePerL("");
    setTotalPrice("");
    setStation("");
    setStore("");
    setDate("");
    loadData();
  }

  // 🔹 Deletar abastecimento
  async function deleteRefuel(id: string) {
    await deleteDoc(doc(db, "refuels", id));
    loadData();
  }

  // 🔹 Filtragem e resumo
  const currentMonth = new Date().getMonth();
  const filteredRefuels = refuels.filter((r) => {
    const refuelMonth = new Date(r.date).getMonth();
    const storeMatch = filterStore === "all" || r.store === filterStore;
    return refuelMonth === currentMonth && storeMatch;
  });

  const totalLiters = filteredRefuels.reduce((sum, r) => sum + (r.liters || 0), 0);
  const totalSpent = filteredRefuels.reduce((sum, r) => sum + (r.totalPrice || 0), 0);

  const formatCurrency = (num: number) =>
    num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">⛽ Abastecimentos</h1>
      <p className="text-gray-600">
        Controle detalhado de abastecimentos e custos da frota do <strong>GrupoMM</strong>.
      </p>

      {/* 📊 Resumo */}
      <div className="bg-black text-yellow-400 rounded-lg p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
        <div>
          <p className="text-sm text-gray-300">Total Gasto no Mês</p>
          <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-300">Total de Litros</p>
          <p className="text-2xl font-bold">{totalLiters.toFixed(2)} L</p>
        </div>
        <div>
          <p className="text-sm text-gray-300">Filtrar por Loja</p>
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="mt-1 border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none w-full"
          >
            <option value="all">Todas as Lojas</option>
            <option value="Destack Magazine">Destack Magazine</option>
            <option value="Renova">Renova</option>
            <option value="Leo Baby">Leo Baby</option>
            <option value="Multi Plast">Multi Plast</option>
          </select>
        </div>
      </div>

      {/* 🔸 Formulário */}
      <form
        onSubmit={addRefuel}
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
                {v.model} — {v.plate}
              </option>
            ))}
          </select>
        </div>

        {/* Km Atual */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Km Atual</label>
          <input
            type="number"
            value={kmCurrent}
            onChange={(e) => setKmCurrent(e.target.value)}
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>

        {/* Preço por Litro */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Preço por Litro (R$)</label>
          <input
            type="number"
            step="0.01"
            value={pricePerL}
            onChange={(e) => setPricePerL(e.target.value)}
            placeholder="Ex: 5.89"
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>

        {/* Valor Total */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Valor Total (R$)</label>
          <input
            type="number"
            step="0.01"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            placeholder="Ex: 300.00"
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>

        {/* Loja responsável */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Loja Pagante</label>
          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          >
            <option value="">Selecione a loja</option>
            <option value="Destack Magazine">Destack Magazine</option>
            <option value="Renova">Renova</option>
            <option value="Leo Baby">Leo Baby</option>
            <option value="Multi Plast">Multi Plast</option>
          </select>
        </div>

        {/* Posto */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Posto</label>
          <input
            type="text"
            value={station}
            onChange={(e) => setStation(e.target.value)}
            placeholder="Ex: Posto Central"
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>

        {/* Data */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="lg:col-span-6 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded px-4 py-2 w-full mt-2 flex items-center justify-center gap-2"
        >
          <PlusCircle size={18} /> Registrar Abastecimento
        </button>
      </form>

      {/* 🔸 Tabela */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-yellow-400 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 text-left">Veículo</th>
              <th className="py-3 px-4 text-left">Km Atual</th>
              <th className="py-3 px-4 text-left">Preço/L</th>
              <th className="py-3 px-4 text-left">Valor Total</th>
              <th className="py-3 px-4 text-left">Litros</th>
              <th className="py-3 px-4 text-left">Loja</th>
              <th className="py-3 px-4 text-left">Posto</th>
              <th className="py-3 px-4 text-left">Data</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredRefuels.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50 transition duration-100">
                <td className="py-3 px-4">{r.vehicle}</td>
                <td className="py-3 px-4">{r.kmCurrent}</td>
                <td className="py-3 px-4">R$ {r.pricePerL?.toFixed(2) || "0.00"}</td>
                <td className="py-3 px-4 font-semibold">R$ {r.totalPrice?.toFixed(2) || "0.00"}</td>
                <td className="py-3 px-4">{r.liters ? r.liters.toFixed(2) + " L" : "-"}</td>
                <td className="py-3 px-4">{r.store}</td>
                <td className="py-3 px-4">{r.station}</td>
                <td className="py-3 px-4">{r.date}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => deleteRefuel(r.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRefuels.length === 0 && (
        <p className="text-gray-500 text-sm text-center">
          Nenhum abastecimento registrado para este mês.
        </p>
      )}
    </div>
  );
}