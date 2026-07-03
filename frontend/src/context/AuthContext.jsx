import { createContext, useContext, useMemo, useState } from "react";
import { loginRequest } from "../services/authService";

const AuthContext = createContext(null);

const readStoredUser = () => {
  const stored = localStorage.getItem("erp_user");
  return stored ? JSON.parse(stored) : null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(localStorage.getItem("erp_token"));

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    localStorage.setItem("erp_token", data.token);
    localStorage.setItem("erp_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
