import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

function getUsers(): StoredUser[] {
  try {
    const saved = localStorage.getItem("akmal-users");
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem("akmal-users", JSON.stringify(users));
}

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

function addToMembers(name: string, email: string) {
  try {
    const saved = localStorage.getItem("akmal-members");
    const members = saved ? JSON.parse(saved) : [];
    if (!members.find((m: any) => m.email?.toLowerCase() === email.toLowerCase())) {
      members.push({
        id: String(Date.now()),
        name,
        email,
        role: "Team Member",
        avatar: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
      });
      localStorage.setItem("akmal-members", JSON.stringify(members));
    }
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Ensure admin is always in members list
    addToMembers("Hanzala", "hanzalaq63@gmail.com");
    return getCurrentUser();
  });
  const isAdmin = user?.email === "hanzalaq63@gmail.com";

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      return { success: false, error: "No account found with this email" };
    }
    if (found.password !== password) {
      return { success: false, error: "Incorrect password" };
    }
    addToMembers(found.name, found.email.toLowerCase());
    const loggedIn: User = { id: found.id, name: found.name, email: found.email };
    setUser(loggedIn);
    setCurrentUser(loggedIn);
    return { success: true };
  };

  const signup = (name: string, email: string, password: string): { success: boolean; error?: string } => {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "An account with this email already exists" };
    }
    const newUser: StoredUser = {
      id: String(Date.now()),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
    saveUsers([...users, newUser]);

    // Auto-add to members list
    addToMembers(name.trim(), email.trim().toLowerCase());

    const loggedIn: User = { id: newUser.id, name: newUser.name, email: newUser.email };
    setUser(loggedIn);
    setCurrentUser(loggedIn);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
