import { Link, NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-layout__sidebar">
        <h2 className="admin-layout__title">Administrador</h2>
        <nav className="admin-layout__nav">
          <NavLink to="/admin/products" className="admin-layout__link">
            Productos
          </NavLink>
          <NavLink to="/admin/orders" className="admin-layout__link">
            Órdenes
          </NavLink>
          <NavLink to="/admin/customers" className="admin-layout__link">
            Clientes
          </NavLink>
        </nav>

        <div className="admin-layout__divider" />

        <Link to="/" className="admin-layout__back-link">
          ← Volver a la tienda
        </Link>
      </aside>
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
