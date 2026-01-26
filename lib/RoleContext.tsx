'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'PO' | 'FL';

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const ROLE_STORAGE_KEY = 'novalance_active_role';

interface RoleProviderProps {
  children: ReactNode;
  defaultRole?: UserRole;
}

export function RoleProvider({ children, defaultRole = 'FL' }: RoleProviderProps) {
  const [role, setRoleState] = useState<UserRole>(defaultRole);
  const router = useRouter();

  // Load role from localStorage on mount
  useEffect(() => {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);
    if (storedRole === 'PO' || storedRole === 'FL') {
      setRoleState(storedRole);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(ROLE_STORAGE_KEY, newRole);
  };

  const toggleRole = () => {
    const newRole: UserRole = role === 'PO' ? 'FL' : 'PO';
    setRole(newRole);
    // Navigate to the new role's home route
    router.push(`/${newRole}`);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, toggleRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
