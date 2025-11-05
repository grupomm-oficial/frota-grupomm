"use client";
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Car,
  MapPin,
  Clock,
  CheckCircle,
  Edit3,
  Trash2,
  XCircle,
} from "lucide-react";

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
  kmEnd?: number;
  distance?: number;
  status: "em-andamento" | "finalizada";
  startedAt: any;
  endedAt?: any;
}

export default function RoutesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  const [vehicle, setVehicle] = useState("");
  const [driver, setDriver] = useState("");
  const [routeName, setRouteName] = useState("");
  const [kmStart, setKmStart] = useState("");

  async function loadData() {
    const vSnap = await getDocs(collection(db, "vehicles"));
    const dSnap = await getDocs(collection(db, "drivers"));
    const rSnap = await getDocs(
      query(collection(db, "routes"), orderBy("startedAt", "desc"))
    );

    setVehicles(vSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Vehicle[]);
    setDrivers(dSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Driver[]);
    setRoutes(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Route[]);
  }

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Km inicial automático
  useEffect(() => {
    if (!vehicle) return;
    const selected = vehicles.find(
      (v) => `${v.model} - ${v.plate}` === vehicle
    );
    if (selected?.kmStart) setKmStart(selected.kmStart.toString());
  }, [vehicle, vehicles]);

  // 🔹 Iniciar nova rota
  async function startRoute(e: any) {
    e.preventDefault();
    if (!vehicle || !driver || !routeName || !kmStart) return alert("Preencha todos os campos.");

    const kmStartValue = parseFloat(kmStart);

    await addDoc(collection(db, "routes"), {
      vehicle,
      driver,
      routeName,
      kmStart: kmStartValue,
      status: "em-andamento",
      startedAt: serverTimestamp(),
    });

    alert("✅ Rota iniciada com sucesso!");
    setVehicle("");
    setDriver("");
    setRouteName("");
    setKmStart("");
    loadData();
  }

  // 🔹 Finalizar rota
  async function finalizeRoute(r: Route) {
    const kmEndValue = parseFloat(
      prompt("Digite o KM atual do veículo para finalizar a rota:") || "0"
    );
    if (!kmEndValue || kmEndValue <= r.kmStart)
      return alert("Valor de KM inválido.");

    const distance = kmEndValue - r.kmStart;

    await updateDoc(doc(db, "routes", r.id), {
      kmEnd: kmEndValue,
      distance,
      status: "finalizada",
      endedAt: serverTimestamp(),
    });

    // Atualiza o KM do veículo
    const vSnap = await getDocs(collection(db, "vehicles"));
    const vehicleDoc = vSnap.docs.find(
      (d) => `${(d.data() as any).model} - ${(d.data() as any).plate}` === r.vehicle
    );
    if (vehicleDoc) {
      await updateDoc(doc(db, "vehicles", vehicleDoc.id), {
        kmStart: kmEndValue,
        lastUpdate: serverTimestamp(),
      });
    }

    alert("✅ Rota finalizada com sucesso!");
    loadData();
  }

  const ongoingRoutes = routes.filter((r) => r.status === "em-andamento");
  const finishedRoutes = routes.filter((r) => r.status === "finalizada");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
        <MapPin className="text-yellow-500" /> Rotas da Frota
      </h1>
      <p className="text-gray-600">
        Controle de início e término das rotas dos veículos do{" "}
        <strong>GrupoMM</strong>.
      </p>

      {/* Formulário */}
      <form
        onSubmit={startRoute}
        className="bg-black text-white p-6 rounded-lg grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Veículo */}
        <div>
          <label className="text-sm text-gray-300">Veículo</label>
          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none w-full"
          >
            <option value="">Selecione o veículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={`${v.model} - ${v.plate}`}>
                {v.model} — {v.plate}
              </option>
            ))}
          </select>
        </div>

        {/* Motorista */}
        <div>
          <label className="text-sm text-gray-300">Motorista</label>
          <select
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none w-full"
          >
            <option value="">Selecione o motorista</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nome da Rota */}
        <div className="lg:col-span-2">
          <label className="text-sm text-gray-300">Rota</label>
          <input
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="Ex: Cedral → Mirinzal"
            className="border border-gray-700 rounded px-3 py-2 bg-black text-yellow-400 placeholder:text-gray-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none w-full"
          />
        </div>

        {/* Km Inicial */}
        <div>
          <label className="text-sm text-gray-300">Km Inicial (auto)</label>
          <input
            value={kmStart}
            disabled
            placeholder="Selecionar veículo"
            className="border border-gray-700 rounded px-3 py-2 bg-gray-800 text-yellow-400 cursor-not-allowed w-full"
          />
        </div>

        <button
          type="submit"
          className="lg:col-span-5 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded px-4 py-2 mt-2"
        >
          Iniciar Rota
        </button>
      </form>

      {/* Rotas em andamento */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="text-yellow-500" /> Rotas em andamento
        </h2>
        {ongoingRoutes.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma rota em andamento.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-black text-yellow-400 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 text-left">Veículo</th>
                <th className="py-3 px-4 text-left">Motorista</th>
                <th className="py-3 px-4 text-left">Rota</th>
                <th className="py-3 px-4 text-left">Km Inicial</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ongoingRoutes.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{r.vehicle}</td>
                  <td className="py-3 px-4">{r.driver}</td>
                  <td className="py-3 px-4">{r.routeName}</td>
                  <td className="py-3 px-4">{r.kmStart}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => finalizeRoute(r)}
                      className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 mx-auto"
                    >
                      <CheckCircle size={18} /> Finalizar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Car className="text-yellow-500" /> Histórico de Rotas Finalizadas
        </h2>
        {finishedRoutes.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma rota finalizada ainda.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-black text-yellow-400 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 text-left">Veículo</th>
                <th className="py-3 px-4 text-left">Motorista</th>
                <th className="py-3 px-4 text-left">Rota</th>
                <th className="py-3 px-4 text-left">Distância</th>
                <th className="py-3 px-4 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {finishedRoutes.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{r.vehicle}</td>
                  <td className="py-3 px-4">{r.driver}</td>
                  <td className="py-3 px-4">{r.routeName}</td>
                  <td className="py-3 px-4">{r.distance?.toFixed(1)} km</td>
                  <td className="py-3 px-4 text-gray-600">
                    {r.endedAt
                      ? new Date(r.endedAt.seconds * 1000).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}