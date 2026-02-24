/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const VALID_EMAIL = "admin@fscape.com";
const VALID_PASSWORD = "admin123";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login(email, password) {
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      setUser({ email, name: "Admin", role: "Administrator" });
      return { success: true };
    }
    return { success: false, error: "Invalid email or password" };
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
