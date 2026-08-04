import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function RequireAuth({ children }) {
  const user = useSelector((state) => state.auth.user);
  const checkedSession = useSelector((state) => state.auth.checkedSession);
  const location = useLocation();

  // Mientras se confirma si hay una sesión guardada, no se decide nada todavía
  // (evita mandar a /login por un instante a alguien que sí tiene sesión).
  if (!checkedSession) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
