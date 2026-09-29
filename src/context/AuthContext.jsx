import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

/**
 * Wraps the whole app. Reads any existing session from localStorage on
 * load, and exposes login()/logout() that every login page calls after
 * hitting the backend. This is the single source of truth for "who is
 * logged in and what role are they" that ProtectedRoute checks against.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (data) => {
    const token = data?.token;
    const userObj = data?.user || {};
    const restaurantId = data?.restaurantId || userObj?.restaurantId;
    if (token) localStorage.setItem("token", token);
    const fullUser = { ...userObj, restaurantId };
    localStorage.setItem("user", JSON.stringify(fullUser));
    setUser(fullUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
