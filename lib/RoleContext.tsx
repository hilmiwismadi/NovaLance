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
    console.log('🎭 RoleProvider: storedRole from localStorage:', storedRole, 'defaultRole:', defaultRole);
    if (storedRole === 'PO' || storedRole === 'FL') {
      console.log('🎭 RoleProvider: Setting role to stored value:', storedRole);
      setRoleState(storedRole);
    } else {
      console.log('🎭 RoleProvider: Using default role:', defaultRole);
    }
  }, [defaultRole]);

  const setRole = (newRole: UserRole) => {
    console.log('🎭 RoleProvider: setRole called with:', newRole);
    setRoleState(newRole);
    localStorage.setItem(ROLE_STORAGE_KEY, newRole);
  };

  const toggleRole = () => {
    const newRole: UserRole = role === 'PO' ? 'FL' : 'PO';
    console.log('🎭 RoleProvider: toggleRole from', role, 'to', newRole);
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
