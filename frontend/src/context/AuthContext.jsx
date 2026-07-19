import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("nomad_user");
    return stored ? JSON.parse(stored) : null;
  });
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("nomad_token");
    if (user && token) {
      const socket = io("/", {
        auth: { token },
        path: "/socket.io",
      });
      socketRef.current = socket;
      return () => socket.disconnect();
    } else if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [user]);

  function login(token, userData) {
    localStorage.setItem("nomad_token", token);
    localStorage.setItem("nomad_user", JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("nomad_token");
    localStorage.removeItem("nomad_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, socket: socketRef }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
