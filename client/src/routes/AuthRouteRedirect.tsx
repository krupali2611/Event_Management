import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthModal } from '@/hooks/useAuthModal';
import type { AuthModalMode } from '@/context/AuthModalContext';

interface AuthRouteRedirectProps {
  mode: AuthModalMode;
}

function AuthRouteRedirect({ mode }: AuthRouteRedirectProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useAuthModal();

  useEffect(() => {
    const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/events';
    openModal(mode, { redirectTo });
    navigate('/events', { replace: true });
  }, [location.state, mode, navigate, openModal]);

  return null;
}

export default AuthRouteRedirect;
