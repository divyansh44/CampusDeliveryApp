import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

const AuthContext = createContext();
const AUTH_STORAGE_KEY = "campus-food-auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed.user);
      setToken(parsed.token);
      api.setToken(parsed.token);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistAuth = useCallback((payload) => {
    setUser(payload.user);
    setToken(payload.token);
    api.setToken(payload.token);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  }, []);

  const login = useCallback(async (input) => {
    const payload = await api.login(input);
    persistAuth(payload);
    return payload.user;
  }, [persistAuth]);

  const register = useCallback(async (input) => {
    const payload = await api.register(input);
    persistAuth(payload);
    return payload.user;
  }, [persistAuth]);

  const googleAuthenticate = useCallback(async (credential, role) => {
    const payload = await api.googleLogin({ credential, role });
    persistAuth(payload);
    return payload.user;
  }, [persistAuth]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    api.setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    api.setToken(token);
    const nextUser = await api.getProfile();
    persistAuth({ user: nextUser, token });
  }, [token, persistAuth]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile, googleAuthenticate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
