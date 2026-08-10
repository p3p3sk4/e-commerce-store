import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { resetCart } from '../store/cartSlice.js';
import './Header.css';

export function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    navigate('/');
  };

  return (
    <header className="header">
      <Link to="/" className="header__brand" aria-label="Hannkat & Xio">
        <span className="header__brand-top">Hannkat</span>
        <span className="header__brand-dot" aria-hidden="true" />
        <span className="header__brand-bottom">Xio</span>
      </Link>

      <nav className="header__nav">
        <Link to="/cart" className="header__link">
          Canasta{cartCount > 0 && <span className="header__badge">{cartCount}</span>}
        </Link>

        {user ? (
          <>
            <Link to="/orders" className="header__link">
              Mis pedidos
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin/products" className="header__link">
                Admin
              </Link>
            )}
            <span className="header__user">Hola, {user.full_name}</span>
            <button type="button" className="header__link header__link--button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="header__link">
              Iniciar sesión
            </Link>
            <Link to="/register" className="header__link">
              Registrarse
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
