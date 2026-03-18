'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface UIContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <UIContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen }}>
      {children}
    </UIContext.Provider>
  );
}
