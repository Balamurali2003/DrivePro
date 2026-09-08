import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  switchRoleDemo: (role: Role) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const defaultUser: User = {
  id: 'usr_owner_1',
  name: 'Vikramaditya Roy (Owner)',
  email: 'owner@drivepro.com',
  role: 'OWNER',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('drivepro_user');
    return saved ? JSON.parse(saved) : defaultUser;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('drivepro_token') || 'demo_token_2026');

  useEffect(() => {
    if (user) {
      localStorage.setItem('drivepro_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('drivepro_user');
    }
  }, [user]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.login({ email, password: pass });
      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('drivepro_token', res.token);
        return true;
      }
      return false;
    } catch {
      // Fallback demo login
      setUser({
        id: 'usr_1',
        name: email.includes('sales') ? 'Rahul Sharma' : 'Vikramaditya Roy',
        email,
        role: email.includes('sales') ? 'SALES_EXECUTIVE' : 'OWNER',
      });
      setToken('demo_token');
      return true;
    }
  };

  const switchRoleDemo = (newRole: Role) => {
    const roleNames: Record<Role, string> = {
      SUPER_ADMIN: 'Super Administrator',
      OWNER: 'Vikramaditya Roy (Owner)',
      MANAGER: 'Pooja Hegde (Operations Manager)',
      RECEPTIONIST: 'Anjali Nair (Front Desk)',
      SALES_EXECUTIVE: 'Rahul Sharma (Sales Lead)',
      INSTRUCTOR: 'Ramesh Gowda (Senior Instructor)',
      ACCOUNTANT: 'Suresh Menon (Finance & Accounts)',
      MECHANIC: 'Basavaraj (Fleet Mechanic)',
      STUDENT: 'Aarav Sharma (Student Portal)',
    };

    const updatedUser: User = {
      id: `usr_${newRole.toLowerCase()}`,
      name: roleNames[newRole] || 'Staff Member',
      email: `${newRole.toLowerCase()}@drivepro.com`,
      role: newRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    setUser(updatedUser);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('drivepro_token');
    localStorage.removeItem('drivepro_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'OWNER',
        token,
        login,
        switchRoleDemo,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
