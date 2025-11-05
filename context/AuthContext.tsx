"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

interface UserData {
  username?: string;
  email?: string;
  role?: string;
  permissions?: Record<string, boolean>;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  hasPermission: (perm: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
  hasPermission: () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Atualiza dados em tempo real do Firestore
  const subscribeToUserDoc = useCallback((uid: string) => {
    const docRef = doc(db, "users", uid);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserData;
          setUserData(data);
          localStorage.setItem("userData", JSON.stringify(data)); // cache local
        }
      },
      (err) => console.error("Erro ao ouvir documento do usuário:", err)
    );
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(true);

      if (firebaseUser) {
        try {
          const cached = localStorage.getItem("userData");
          if (cached) setUserData(JSON.parse(cached));

          const unsubUser = subscribeToUserDoc(firebaseUser.uid);
          return () => unsubUser();
        } catch (err) {
          console.error("Erro ao buscar userData:", err);
        }
      } else {
        setUserData(null);
        localStorage.removeItem("userData");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [subscribeToUserDoc]);

  async function logout() {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    localStorage.removeItem("userData");
  }

  // 🔸 Helpers de permissão
  const isAdmin = userData?.role === "admin";
  const hasPermission = (perm: string) => {
    return !!userData?.permissions?.[perm] || isAdmin;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isAdmin,
        hasPermission,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}