import { createContext, useContext, useState, type ReactNode } from "react";

const API_BASE = "/api";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  dbUserId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getCurrentUser(): User | null {
  try {
    const saved = localStorage.getItem("akmal-current-user");
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem("akmal-current-user", JSON.stringify(user));
  } else {
    localStorage.removeItem("akmal-current-user");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const isAdmin = user?.email === "akmal26426@gmail.com";
  const dbUserId = user?.id || null;

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (data.success) {
        const loggedIn: User = { id: String(data.user.id), name: data.user.name, email: data.user.email };
        setUser(loggedIn);
        setCurrentUser(loggedIn);
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch {
      return { success: false, error: "Server connection failed" };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (data.success) {
        const loggedIn: User = { id: String(data.user.id), name: data.user.name, email: data.user.email };
        setUser(loggedIn);
        setCurrentUser(loggedIn);
        return { success: true };
      }
      return { success: false, error: data.error || "Signup failed" };
    } catch {
      return { success: false, error: "Server connection failed" };
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, signup, logout, dbUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
