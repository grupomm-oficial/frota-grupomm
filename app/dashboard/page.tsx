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
  Route,
  Fuel,
  GaugeCircle,
  MapPinned,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

interface Vehicle {
  id: string;
}
interface RouteData {
  id: string;
  distance: number;
  date?: string;
}
interface Refuel {
  id: string;
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

  // ======================
  // 📊 Cálculos principais
  // ======================
  const totalVehicles = vehicles.length;
  const totalRoutes = routes.length;
  const totalRefuels = refuels.length;

  const totalKm = routes.reduce((sum, r) => sum + (r.distance || 0), 0);
  const totalLiters = refuels.reduce((sum, r) => sum + (r.liters || 0), 0);
  const totalCost = refuels.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const avgConsumption = totalLiters > 0 ? totalKm / totalLiters : 0;

  // ======================
  // 🧮 Comparação mensal
  // ======================
  const currentMonth = new Date().getMonth();
  const previousMonth = (currentMonth - 1 + 12) % 12;

  const currentRoutes = routes.filter((r) => r.date && new Date(r.date).getMonth() === currentMonth);
  const prevRoutes = routes.filter((r) => r.date && new Date(r.date).getMonth() === previousMonth);

  const currentRefuels = refuels.filter((r) => {
    const d = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : new Date();
    return d.getMonth() === currentMonth;
  });
  const prevRefuels = refuels.filter((r) => {
    const d = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : new Date();
    return d.getMonth() === previousMonth;
  });

  const kmThisMonth = currentRoutes.reduce((s, r) => s + (r.distance || 0), 0);
  const kmLastMonth = prevRoutes.reduce((s, r) => s + (r.distance || 0), 0);
  const costThisMonth = currentRefuels.reduce((s, r) => s + (r.totalPrice || 0), 0);
  const costLastMonth = prevRefuels.reduce((s, r) => s + (r.totalPrice || 0), 0);
  const litersThisMonth = currentRefuels.reduce((s, r) => s + (r.liters || 0), 0);
  const litersLastMonth = prevRefuels.reduce((s, r) => s + (r.liters || 0), 0);

  const avgThisMonth = litersThisMonth > 0 ? kmThisMonth / litersThisMonth : 0;
  const avgLastMonth = litersLastMonth > 0 ? kmLastMonth / litersLastMonth : 0;

  const calcVariation = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const kmVar = calcVariation(kmThisMonth, kmLastMonth);
  const costVar = calcVariation(costThisMonth, costLastMonth);
  const litersVar = calcVariation(litersThisMonth, litersLastMonth);
  const avgVar = calcVariation(avgThisMonth, avgLastMonth);

  const VarIndicator = ({ value }: { value: number }) => (
    <div className={`flex items-center justify-center gap-1 text-sm font-medium ${
      value >= 0 ? "text-green-600" : "text-red-600"
    }`}>
      {value >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
      {Math.abs(value).toFixed(1)}%
    </div>
  );

  // ======================
  // 📈 Gráfico de evolução
  // ======================
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const kmPerMonth = Array(12).fill(0);
  const costPerMonth = Array(12).fill(0);

  routes.forEach((r) => {
    if (!r.date) return;
    const m = new Date(r.date).getMonth();
    kmPerMonth[m] += r.distance || 0;
  });
  refuels.forEach((r) => {
    const d = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : new Date();
    const m = d.getMonth();
    costPerMonth[m] += r.totalPrice || 0;
  });

  const data = {
    labels: months,
    datasets: [
      {
        label: "KM Rodados",
        data: kmPerMonth,
        borderColor: "#FFD700",
        backgroundColor: "rgba(255,215,0,0.2)",
        tension: 0.4,
      },
      {
        label: "Gasto com Combustível (R$)",
        data: costPerMonth,
        borderColor: "#000",
        backgroundColor: "rgba(0,0,0,0.1)",
        tension: 0.4,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: true, labels: { color: "#000" } } },
    scales: {
      x: { ticks: { color: "#000" } },
      y: { ticks: { color: "#000" } },
    },
  };

  // ======================
  // 🖼️ Interface
  // ======================
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">📊 Painel da Frota</h1>
      <p className="text-gray-600">
        Acompanhe a performance e variações mensais da frota do{" "}
        <strong>GrupoMM</strong>.
      </p>

      {/* 🔸 Indicadores principais */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-black text-yellow-400 rounded-lg p-6 shadow text-center">
          <Car className="mx-auto mb-2" />
          <p className="text-sm text-gray-300">Total de Veículos</p>
          <p className="text-3xl font-bold">{totalVehicles}</p>
        </div>
        <div className="bg-black text-yellow-400 rounded-lg p-6 shadow text-center">
          <Route className="mx-auto mb-2" />
          <p className="text-sm text-gray-300">Rotas Registradas</p>
          <p className="text-3xl font-bold">{totalRoutes}</p>
        </div>
        <div className="bg-black text-yellow-400 rounded-lg p-6 shadow text-center">
          <Fuel className="mx-auto mb-2" />
          <p className="text-sm text-gray-300">Abastecimentos</p>
          <p className="text-3xl font-bold">{totalRefuels}</p>
        </div>
        <div className="bg-black text-yellow-400 rounded-lg p-6 shadow text-center">
          <GaugeCircle className="mx-auto mb-2" />
          <p className="text-sm text-gray-300">Média de Consumo</p>
          <p className="text-3xl font-bold">
            {avgConsumption > 0 ? avgConsumption.toFixed(2) + " km/L" : "-"}
          </p>
        </div>
      </div>

      {/* 🔸 Comparativos */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white shadow rounded p-4 text-center">
          <MapPinned className="mx-auto mb-2 text-gray-700" />
          <p className="text-sm text-gray-500">KM Rodados (mês)</p>
          <p className="text-2xl font-bold text-gray-800">{kmThisMonth.toFixed(2)} km</p>
          <VarIndicator value={kmVar} />
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <Fuel className="mx-auto mb-2 text-gray-700" />
          <p className="text-sm text-gray-500">Litros Abastecidos</p>
          <p className="text-2xl font-bold text-gray-800">{litersThisMonth.toFixed(2)} L</p>
          <VarIndicator value={litersVar} />
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <DollarSign className="mx-auto mb-2 text-gray-700" />
          <p className="text-sm text-gray-500">Custo do Mês</p>
          <p className="text-2xl font-bold text-gray-800">R$ {costThisMonth.toFixed(2)}</p>
          <VarIndicator value={costVar} />
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <GaugeCircle className="mx-auto mb-2 text-gray-700" />
          <p className="text-sm text-gray-500">Consumo Médio</p>
          <p className="text-2xl font-bold text-gray-800">
            {avgThisMonth > 0 ? avgThisMonth.toFixed(2) + " km/L" : "-"}
          </p>
          <VarIndicator value={avgVar} />
        </div>
      </div>

      {/* 🔸 Gráfico */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Evolução Mensal — KM x Gasto
        </h2>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}