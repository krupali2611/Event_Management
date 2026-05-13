import { createContext, useCallback, useMemo, useState, type PropsWithChildren } from 'react';

export type AuthModalMode = 'login' | 'register';

interface OpenAuthModalOptions {
  redirectTo?: string | null;
}

export interface AuthModalContextValue {
  isOpen: boolean;
  mode: AuthModalMode;
  redirectTo: string | null;
  openModal: (mode: AuthModalMode, options?: OpenAuthModalOptions) => void;
  closeModal: () => void;
  setMode: (mode: AuthModalMode) => void;
}

export const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>('login');
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const openModal = useCallback((nextMode: AuthModalMode, options?: OpenAuthModalOptions) => {
    setMode(nextMode);
    setRedirectTo(options?.redirectTo ?? null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setRedirectTo(null);
  }, []);

  const value = useMemo<AuthModalContextValue>(
    () => ({
      isOpen,
      mode,
      redirectTo,
      openModal,
      closeModal,
      setMode,
    }),
    [closeModal, isOpen, mode, openModal, redirectTo],
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}
