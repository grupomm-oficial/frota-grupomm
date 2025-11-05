"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  Check,
  X,
  Trash2,
  Edit3,
  PlusCircle,
  Shield,
  UserCog,
  LockKeyhole,
  Save,
} from "lucide-react";

// ─────────────────────────────
// TIPAGENS
// ─────────────────────────────
interface Permissions {
  viewVehicles: boolean;
  manageVehicles: boolean;
  viewRoutes: boolean;
  editRoutes: boolean;
  viewRefuels: boolean;
  addRefuels: boolean;
  generateReports: boolean;
  manageUsers: boolean;
}

interface UserDoc {
  username: string;
  email: string;
  role: string;
  permissions: Permissions;
}

interface UserRow extends UserDoc {
  id: string;
}

// ─────────────────────────────
// TRADUÇÕES / GRUPOS
// ─────────────────────────────
const permissionLabels: Record<keyof Permissions, string> = {
  viewVehicles: "Visualizar veículos",
  manageVehicles: "Gerenciar veículos",
  viewRoutes: "Visualizar rotas",
  editRoutes: "Editar rotas",
  viewRefuels: "Visualizar abastecimentos",
  addRefuels: "Registrar abastecimentos",
  generateReports: "Gerar relatórios",
  manageUsers: "Gerenciar usuários",
};

const permissionGroups = {
  Frota: ["viewVehicles", "manageVehicles"],
  Rotas: ["viewRoutes", "editRoutes"],
  Abastecimento: ["viewRefuels", "addRefuels"],
  Relatórios: ["generateReports"],
  Administração: ["manageUsers"],
};

// ─────────────────────────────
// COMPONENTE
// ─────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<UserRow | null>(null);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    permissions: {
      viewVehicles: true,
      manageVehicles: false,
      viewRoutes: true,
      editRoutes: false,
      viewRefuels: true,
      addRefuels: false,
      generateReports: false,
      manageUsers: false,
    } as Permissions,
  });

  // ─────────────────────────────
  // CARREGAR USUÁRIOS
  // ─────────────────────────────
  async function loadUsers() {
    const snap = await getDocs(collection(db, "users"));
    const data = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as UserDoc),
    }));
    setUsers(data);
    setLoading(false);
  }

  // ─────────────────────────────
  // CRIAR USUÁRIO
  // ─────────────────────────────
  async function handleCreateUser(e: any) {
    e.preventDefault();
    setCreating(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      await setDoc(doc(db, "users", cred.user.uid), {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        permissions: newUser.permissions,
      });

      alert("✅ Usuário criado com sucesso!");
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "user",
        permissions: {
          viewVehicles: true,
          manageVehicles: false,
          viewRoutes: true,
          editRoutes: false,
          viewRefuels: true,
          addRefuels: false,
          generateReports: false,
          manageUsers: false,
        },
      });
      loadUsers();
    } catch (err: any) {
      console.error("Erro ao criar usuário:", err.message);
      alert("❌ Erro ao criar usuário. Verifique os dados e tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  // ─────────────────────────────
  // EDIÇÃO
  // ─────────────────────────────
  function startEdit(u: UserRow) {
    setEditingId(u.id);
    setEditData({ ...u });
  }

  async function saveEdit() {
    if (!editData) return;
    const { id, ...data } = editData;
    try {
      await updateDoc(doc(db, "users", id), data);
      alert("✅ Alterações salvas com sucesso!");
      setEditingId(null);
      setEditData(null);
      loadUsers();
    } catch (err) {
      console.error("Erro ao salvar alterações:", err);
      alert("❌ Não foi possível atualizar o usuário.");
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    await deleteDoc(doc(db, "users", id));
    loadUsers();
  }

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) return <p>Carregando usuários...</p>;

  // ─────────────────────────────
  // INTERFACE
  // ─────────────────────────────
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
        <UserCog className="text-yellow-500" /> Gerenciar Usuários
      </h1>
      <p className="text-gray-600">
        Controle total dos acessos e permissões do sistema{" "}
        <strong>GrupoMM</strong>.
      </p>

      {/* FORMULÁRIO DE CRIAÇÃO */}
      <form
        onSubmit={handleCreateUser}
        className="bg-black text-white p-6 rounded-lg grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div>
          <label className="text-sm text-gray-300 mb-1 block">
            Nome de usuário
          </label>
          <input
            value={newUser.username}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
            placeholder="Ex: joao.silva"
            className="border border-gray-700 rounded px-3 py-2 w-full bg-gray-100 text-black placeholder-gray-500 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-1 block">E-mail</label>
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="Ex: joao@email.com"
            className="border border-gray-700 rounded px-3 py-2 w-full bg-gray-100 text-black placeholder-gray-500 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-1 block">Senha</label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            placeholder="Mínimo 6 caracteres"
            className="border border-gray-700 rounded px-3 py-2 w-full bg-gray-100 text-black placeholder-gray-500 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-1 block">Função</label>
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="border border-gray-700 rounded px-3 py-2 w-full bg-black text-yellow-400 focus:ring-2 focus:ring-yellow-400"
          >
            <option value="user">Usuário</option>
            <option value="manager">Gerente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div className="lg:col-span-4 mt-4 space-y-5">
          <div className="flex items-center gap-2 text-yellow-400 font-semibold">
            <Shield size={18} /> Permissões de Acesso
          </div>

          {Object.entries(permissionGroups).map(([groupName, perms]) => (
            <div key={groupName} className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-yellow-400 font-semibold mb-2 flex items-center gap-1">
                <LockKeyhole size={14} /> {groupName}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {perms.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={newUser.permissions[key as keyof Permissions]}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          permissions: {
                            ...newUser.permissions,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                    {permissionLabels[key as keyof Permissions]}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={creating}
          className="col-span-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded px-4 py-2 flex items-center justify-center mt-4 transition"
        >
          <PlusCircle size={18} className="mr-2" />
          {creating ? "Criando usuário..." : "Criar novo usuário"}
        </button>
      </form>

      {/* LISTA DE USUÁRIOS */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-yellow-400 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 text-left">Usuário</th>
              <th className="py-3 px-4 text-left">E-mail</th>
              <th className="py-3 px-4 text-left">Função</th>
              <th className="py-3 px-4 text-left">Permissões</th>
              <th className="py-3 px-4 text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) =>
              editingId === u.id ? (
                <tr key={u.id} className="border-b bg-gray-100">
                  <td colSpan={5} className="p-6">
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                          value={editData?.username ?? ""}
                          onChange={(e) =>
                            setEditData((prev) =>
                              prev ? { ...prev, username: e.target.value } : prev
                            )
                          }
                          placeholder="Nome de usuário"
                          className="border rounded px-3 py-2 w-full bg-white text-black"
                        />
                        <input
                          value={editData?.email ?? ""}
                          onChange={(e) =>
                            setEditData((prev) =>
                              prev ? { ...prev, email: e.target.value } : prev
                            )
                          }
                          placeholder="E-mail"
                          className="border rounded px-3 py-2 w-full bg-white text-black"
                        />
                        <select
                          value={editData?.role ?? ""}
                          onChange={(e) =>
                            setEditData((prev) =>
                              prev ? { ...prev, role: e.target.value } : prev
                            )
                          }
                          className="border rounded px-3 py-2 w-full bg-black text-yellow-400"
                        >
                          <option value="user">Usuário</option>
                          <option value="manager">Gerente</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>

                      {/* Permissões organizadas */}
                      {Object.entries(permissionGroups).map(([group, perms]) => (
                        <div key={group} className="bg-gray-200 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">
                            {group}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {perms.map((key) => (
                              <label
                                key={key}
                                className="flex items-center gap-2 text-sm text-gray-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    editData?.permissions[key as keyof Permissions] ??
                                    false
                                  }
                                  onChange={(e) =>
                                    setEditData((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            permissions: {
                                              ...prev.permissions,
                                              [key]: e.target.checked,
                                            },
                                          }
                                        : prev
                                    )
                                  }
                                />
                                {permissionLabels[key as keyof Permissions]}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={saveEdit}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                          <Save size={18} /> Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                          <X size={18} /> Cancelar
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr
                  key={u.id}
                  className="border-b hover:bg-gray-50 transition duration-100"
                >
                  <td className="py-3 px-4 font-medium">{u.username}</td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4 capitalize">{u.role}</td>
                  <td className="py-3 px-4 text-xs text-gray-700">
                    {Object.entries(u.permissions)
                      .filter(([_, val]) => val)
                      .map(([key]) => permissionLabels[key as keyof Permissions])
                      .join(", ") || "Nenhuma"}
                  </td>
                  <td className="py-3 px-4 text-center flex justify-center gap-2">
                    <button
                      onClick={() => startEdit(u)}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}