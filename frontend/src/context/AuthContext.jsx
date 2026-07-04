import { createContext, useContext, useMemo, useState } from "react";
import { loginRequest } from "../services/authService";

const AuthContext = createContext(null);

const readStoredUser = () => {
  const stored = localStorage.getItem("erp_user");
  return stored ? JSON.parse(stored) : null;
};

const readStoredCompany = () => {
  const stored = localStorage.getItem("erp_company");
  return stored ? JSON.parse(stored) : null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [company, setCompany] = useState(readStoredCompany);
  const [token, setToken] = useState(localStorage.getItem("erp_token"));

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    localStorage.setItem("erp_token", data.token);
    localStorage.setItem("erp_user", JSON.stringify(data.user));
    localStorage.setItem("erp_company", JSON.stringify(data.company));
    setToken(data.token);
    setUser(data.user);
    setCompany(data.company);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    localStorage.removeItem("erp_company");
    setToken(null);
    setUser(null);
    setCompany(null);
  };

  const updateStoredUser = (nextUser) => {
    localStorage.setItem("erp_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const markPasswordChanged = () => {
    const nextUser = { ...user, mustChangePassword: false };
    localStorage.setItem("erp_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const value = useMemo(
    () => ({
      user,
      company,
      token,
      role: user?.role,
      isAuthenticated: Boolean(token && user && company),
      login,
      logout,
      updateStoredUser,
      markPasswordChanged
    }),
    [token, user, company]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
