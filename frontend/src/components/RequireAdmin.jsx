import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RequireAuth } from './RequireAuth.jsx';

function AdminOnly({ children }) {
  const user = useSelector((state) => state.auth.user);
  if (user && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Primero exige sesión iniciada (RequireAuth ya maneja la espera de
// restoreSession), y luego exige que el usuario sea admin.
export function RequireAdmin({ children }) {
  return (
    <RequireAuth>
      <AdminOnly>{children}</AdminOnly>
    </RequireAuth>
  );
}
