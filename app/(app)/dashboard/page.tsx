"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Car,
  Fuel,
  GaugeCircle,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface Vehicle {
  id: string;
  model: string;
  plate: string;
}
interface RouteData {
  id: string;
  vehicle: string;
  distance: number;
  date?: string;
}
interface Refuel {
  id: string;
  vehicle: string;
  liters: number;
  totalPrice: number;
  createdAt?: any;
}

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const vSnap = await getDocs(collection(db, "vehicles"));
      const rSnap = await getDocs(collection(db, "routes"));
      const fSnap = await getDocs(collection(db, "refuels"));
      setVehicles(vSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Vehicle[]);
      setRoutes(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as RouteData[]);
      setRefuels(fSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Refuel[]);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Carregando dados...
      </div>
    );
  }

  // ========= Cálculos principais =========
  const totalVehicles = vehicles.length;
  const totalRoutes = routes.length;
  const totalRefuels = refuels.length;

  const totalKm = routes.reduce((sum, r) => sum + (r.distance || 0), 0);
  const totalLiters = refuels.reduce((sum, r) => sum + (r.liters || 0), 0);
  const avgConsumption = totalLiters > 0 ? totalKm / totalLiters : 0;

  // ========= Consumo médio mensal =========
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const consumptionPerMonth = Array(12).fill(0);
  const kmPerMonth = Array(12).fill(0);
  const litersPerMonth = Array(12).fill(0);

  routes.forEach((r) => {
    if (!r.date) return;
    const m = new Date(r.date).getMonth();
    kmPerMonth[m] += r.distance || 0;
  });

  refuels.forEach((r) => {
    const d = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : new Date();
    const m = d.getMonth();
    litersPerMonth[m] += r.liters || 0;
  });

  months.forEach((_, i) => {
    consumptionPerMonth[i] =
      litersPerMonth[i] > 0 ? kmPerMonth[i] / litersPerMonth[i] : 0;
  });

  const data = {
    labels: months,
    datasets: [
      {
        label: "Consumo Médio (km/L)",
        data: consumptionPerMonth,
        borderColor: "#facc15",
        backgroundColor: "rgba(250,204,21,0.3)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { labels: { color: "#111" } },
    },
    scales: {
      x: { ticks: { color: "#111" } },
      y: { ticks: { color: "#111" } },
    },
  };

  // ========= Ranking dos veículos =========
  const distanceByVehicle: Record<string, number> = {};
  routes.forEach((r) => {
    if (!r.vehicle) return;
    distanceByVehicle[r.vehicle] =
      (distanceByVehicle[r.vehicle] || 0) + r.distance;
  });

  const topVehicles = Object.entries(distanceByVehicle)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // ========= Interface =========
  return (
    <div className="space-y-10">
      {/* Cabeçalho aprimorado */}
      <header className="bg-black text-yellow-400 rounded-xl shadow-md p-6 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Painel de Controle
          </h1>
          <p className="text-sm text-gray-300">
            Dados atualizados automaticamente do sistema do{" "}
            <strong className="text-yellow-400">Grupo MM</strong>.
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-gray-400 text-sm text-center">
          Usuário conectado:{" "}
          <span className="text-yellow-300 font-semibold">jottamidia</span>
        </div>
      </header>

      {/* Indicadores principais */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Car, label: "Veículos", value: totalVehicles },
          { icon: Fuel, label: "Abastecimentos", value: totalRefuels },
          { icon: GaugeCircle, label: "Rotas", value: totalRoutes },
          {
            icon: GaugeCircle,
            label: "Consumo Médio",
            value: avgConsumption > 0 ? `${avgConsumption.toFixed(2)} km/L` : "-",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-black text-yellow-400 rounded-2xl p-6 shadow-lg hover:shadow-yellow-400/20 transition"
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-yellow-400/10 rounded-full">
                <item.icon size={28} />
              </div>
              <p className="text-gray-300 text-sm">{item.label}</p>
              <p className="text-3xl font-bold">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gráfico de consumo */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Evolução Mensal de Consumo (km/L)
        </h2>
        <Line data={data} options={options} />
      </div>

      {/* Ranking dos veículos */}
      <div className="bg-black rounded-2xl text-yellow-400 p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="text-yellow-400" /> Top 3 Veículos que Mais Rodaram
        </h2>
        {topVehicles.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum dado disponível.</p>
        ) : (
          <ul className="space-y-3">
            {topVehicles.map(([vehicle, distance], index) => {
              const percent =
                (distance / topVehicles[0][1]) * 100;
              return (
                <li key={vehicle} className="space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span>
                      {index + 1}º — {vehicle}
                    </span>
                    <span>{distance.toFixed(1)} km</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}