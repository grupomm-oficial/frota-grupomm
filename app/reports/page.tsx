"use client";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Refuel {
  id?: string;
  vehicle: string;
  liters: number;
  pricePerL: number;
  totalPrice: number;
  store: string;
  station?: string;
  date?: string;
  createdAt?: any;
}

interface Route {
  id?: string;
  vehicle: string;
  driver: string;
  routeName: string;
  kmStart: number;
  kmEnd: number;
  distance: number;
  date?: string;
  createdAt?: any;
}

export default function ReportsPage() {
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [filteredRefuels, setFilteredRefuels] = useState<Refuel[]>([]);

  // 🔹 Carregar dados
  async function loadData() {
    const refuelsSnap = await getDocs(collection(db, "refuels"));
    const routesSnap = await getDocs(collection(db, "routes"));

    const refuelsData = refuelsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as Refuel[];

    const routesData = routesSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as Route[];

    setRefuels(refuelsData);
    setRoutes(routesData);

    const allVehicles = Array.from(
      new Set([
        ...refuelsData.map((r) => r.vehicle),
        ...routesData.map((r) => r.vehicle),
      ])
    ).filter(Boolean);
    setVehicles(allVehicles);
  }

  // 🔹 Filtro automático do mês atual
  useEffect(() => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    setStartDate(first);
    setEndDate(last);
  }, []);

  // 🔹 Filtragem
  useEffect(() => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);

    function getDate(entry: any) {
      if (entry.date) return new Date(entry.date);
      if (entry.createdAt?.seconds) return new Date(entry.createdAt.seconds * 1000);
      return null;
    }

    const filteredR = routes.filter((r) => {
      const d = getDate(r);
      if (!d) return false;
      return (
        (!vehicleFilter || r.vehicle === vehicleFilter) &&
        d >= start &&
        d <= end
      );
    });

    const filteredF = refuels.filter((r) => {
      const d = getDate(r);
      if (!d) return false;
      return (
        (!vehicleFilter || r.vehicle === vehicleFilter) &&
        d >= start &&
        d <= end
      );
    });

    setFilteredRoutes(filteredR);
    setFilteredRefuels(filteredF);
  }, [startDate, endDate, vehicleFilter, routes, refuels]);

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Cálculos
  const totalKm = filteredRoutes.reduce((s, r) => s + (r.distance || 0), 0);
  const totalLiters = filteredRefuels.reduce((s, r) => s + (r.liters || 0), 0);
  const totalCost = filteredRefuels.reduce((s, r) => s + (r.totalPrice || 0), 0);
  const avgConsumption = totalLiters > 0 ? totalKm / totalLiters : 0;

  // 🔹 PDF
  function generatePDF() {
    const doc = new jsPDF("p", "mm", "a4");
    const title = "Grupo MM – Relatório de Frota";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Período: ${startDate.split("-").reverse().join("/")} até ${endDate
        .split("-")
        .reverse()
        .join("/")}`,
      14,
      25
    );
    if (vehicleFilter) doc.text(`Veículo: ${vehicleFilter}`, 14, 32);

    doc.setFont("helvetica", "bold");
    doc.text("Resumo Geral:", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Rotas: ${filteredRoutes.length}`, 14, 50);
    doc.text(`Distância Total: ${totalKm.toFixed(2)} km`, 14, 56);
    doc.text(`Litros Abastecidos: ${totalLiters.toFixed(2)} L`, 14, 62);
    doc.text(`Custo Total: R$ ${totalCost.toFixed(2)}`, 14, 68);
    doc.text(
      `Média de Consumo: ${
        avgConsumption > 0 ? avgConsumption.toFixed(2) + " km/L" : "-"
      }`,
      14,
      74
    );

    // 🛣️ Rotas
    autoTable(doc, {
      startY: 82,
      head: [["Data", "Veículo", "Motorista", "Rota", "Distância (km)"]],
      body: filteredRoutes.map((r) => [
        r.date ||
          (r.createdAt?.seconds
            ? new Date(r.createdAt.seconds * 1000).toLocaleDateString("pt-BR")
            : "-"),
        r.vehicle,
        r.driver || "-",
        r.routeName || "-",
        r.distance.toFixed(2),
      ]),
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 204, 0] },
      styles: { fontSize: 9 },
    });

    // ⛽ Abastecimentos
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Data", "Veículo", "Posto", "Loja", "Litros", "Total (R$)"]],
      body: filteredRefuels.map((r) => [
        r.date ||
          (r.createdAt?.seconds
            ? new Date(r.createdAt.seconds * 1000).toLocaleDateString("pt-BR")
            : "-"),
        r.vehicle,
        r.station || "-",
        r.store || "-",
        (r.liters || 0).toFixed(2),
        (r.totalPrice || 0).toFixed(2),
      ]),
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 204, 0] },
      styles: { fontSize: 9 },
    });

    doc.save(`Relatorio_Frota_${startDate}_${endDate}.pdf`);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">📊 Relatórios</h1>
      <p className="text-gray-600">
        Consulte, visualize e exporte os dados da frota do <strong>GrupoMM</strong>.
      </p>

      {/* 🔸 Filtros */}
      <div className="bg-black text-white p-6 rounded-lg grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Período Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-black border border-gray-700 text-yellow-400 rounded px-3 py-2 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Período Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-black border border-gray-700 text-yellow-400 rounded px-3 py-2 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-col lg:col-span-2">
          <label className="text-gray-300 mb-1">Veículo</label>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="bg-black border border-gray-700 text-yellow-400 rounded px-3 py-2 focus:ring-1 focus:ring-yellow-400 focus:outline-none"
          >
            <option value="">Todos os veículos</option>
            {vehicles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🔸 Resumo */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-sm text-gray-500">Total de Rotas</p>
          <p className="text-2xl font-bold text-gray-800">{filteredRoutes.length}</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-sm text-gray-500">Distância Total</p>
          <p className="text-2xl font-bold text-gray-800">{totalKm.toFixed(2)} km</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-sm text-gray-500">Litros Abastecidos</p>
          <p className="text-2xl font-bold text-gray-800">{totalLiters.toFixed(2)} L</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-sm text-gray-500">Média de Consumo</p>
          <p className="text-2xl font-bold text-gray-800">
            {avgConsumption > 0 ? avgConsumption.toFixed(2) + " km/L" : "-"}
          </p>
        </div>
      </div>

      {/* 🛣️ Tabela de Rotas */}
      {filteredRoutes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-2">🛣️ Rotas registradas</h2>
          <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-black text-yellow-400 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 text-left">Data</th>
                  <th className="py-3 px-4 text-left">Veículo</th>
                  <th className="py-3 px-4 text-left">Motorista</th>
                  <th className="py-3 px-4 text-left">Rota</th>
                  <th className="py-3 px-4 text-left">Distância (km)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((r) => (
                  <tr key={r.id ?? Math.random()} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {r.date ||
                        (r.createdAt?.seconds
                          ? new Date(r.createdAt.seconds * 1000).toLocaleDateString("pt-BR")
                          : "-")}
                    </td>
                    <td className="py-3 px-4">{r.vehicle}</td>
                    <td className="py-3 px-4">{r.driver || "-"}</td>
                    <td className="py-3 px-4">{r.routeName || "-"}</td>
                    <td className="py-3 px-4">{r.distance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ⛽ Tabela de Abastecimentos */}
      {filteredRefuels.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-2">⛽ Abastecimentos realizados</h2>
          <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-black text-yellow-400 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 text-left">Data</th>
                  <th className="py-3 px-4 text-left">Veículo</th>
                  <th className="py-3 px-4 text-left">Loja</th>
                  <th className="py-3 px-4 text-left">Litros</th>
                  <th className="py-3 px-4 text-left">Total (R$)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefuels.map((r) => (
                  <tr key={r.id ?? Math.random()} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {r.date ||
                        (r.createdAt?.seconds
                          ? new Date(r.createdAt.seconds * 1000).toLocaleDateString("pt-BR")
                          : "-")}
                    </td>
                    <td className="py-3 px-4">{r.vehicle}</td>
                    <td className="py-3 px-4">{r.store || "-"}</td>
                    <td className="py-3 px-4">{r.liters?.toFixed(2)} L</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      R$ {r.totalPrice?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔸 Botão PDF */}
      <div className="flex justify-end">
        <button
          onClick={generatePDF}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded px-6 py-3 shadow mt-6"
        >
          📄 Gerar PDF
        </button>
      </div>
    </div>
  );
}