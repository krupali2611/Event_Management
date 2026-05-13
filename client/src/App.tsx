import AppRoutes from '@/routes/AppRoutes';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { NotificationProvider } from '@/context/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthModalProvider>
    </AuthProvider>
  );
}

export default App;
