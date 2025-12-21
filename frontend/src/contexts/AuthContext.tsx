import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: any | null;
  setUser: (user: any | null) => void;
  deleteAccount: () => void;
}

interface DecodedToken {
  exp: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const expiryTimeMillis = decoded.exp * 1000;
      const nowMillis = Date.now();

      const timeout = expiryTimeMillis - nowMillis;    

      if (timeout <= 0) {
        localStorage.clear();
        setUser(null);
      } else {
        const timerId = setTimeout(() => {
          localStorage.clear();
          setUser(null);

          window.location.href = '/login';
        }, timeout);

        return () => clearTimeout(timerId);
      }
    } catch (error) {
      localStorage.clear();
      setUser(null);
    }
  }, []);

  const deleteAccount = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
