import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { resetCart } from '../store/cartSlice.js';
import { resetFavorites } from '../store/favoritesSlice.js';
import { markAllNotificationsRead, markNotificationRead, resetNotifications } from '../store/notificationsSlice.js';
import { openSearch } from '../store/catalogSlice.js';
import { BagIcon, BellIcon, HeartIcon, SearchIcon, UserIcon } from './icons.jsx';
import './Header.css';

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'justo ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

export function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const cartCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const favoritesCount = useSelector((state) => state.favorites.productIds.length);
  const notifications = useSelector((state) => state.notifications.items);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const closeMenus = () => {
    setIsAccountOpen(false);
    setIsNotifOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCart());
    dispatch(resetFavorites());
    dispatch(resetNotifications());
    closeMenus();
    navigate('/');
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) dispatch(markNotificationRead(notif.id));
    closeMenus();
    if (notif.order_id) navigate(`/orders/${notif.order_id}`);
  };

  return (
    <header className="header">
      {(isAccountOpen || isNotifOpen) && <div className="header__backdrop" onClick={closeMenus} />}

      <div className="header__side header__side--left">
        {user && (
          <>
            <Link to="/favorites" className="header__icon-btn" aria-label="Favoritos" onClick={closeMenus}>
              <HeartIcon />
              {favoritesCount > 0 && <span className="header__icon-badge">{favoritesCount}</span>}
            </Link>

            <div className="header__menu-anchor">
              <button
                type="button"
                className="header__icon-btn"
                aria-label="Notificaciones"
                onClick={() => {
                  setIsNotifOpen((v) => !v);
                  setIsAccountOpen(false);
                }}
              >
                <BellIcon />
                {unreadCount > 0 && <span className="header__icon-badge">{unreadCount}</span>}
              </button>

              {isNotifOpen && (
                <div className="header__dropdown header__dropdown--notifications">
                  <div className="header__dropdown-title-row">
                    <span className="header__dropdown-title">Notificaciones</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="header__dropdown-action"
                        onClick={() => dispatch(markAllNotificationsRead())}
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="header__dropdown-empty">Todavía no tienes notificaciones.</p>
                  ) : (
                    <ul className="header__notif-list">
                      {notifications.map((notif) => (
                        <li key={notif.id}>
                          <button
                            type="button"
                            className={`header__notif-item ${notif.is_read ? '' : 'is-unread'}`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <span>{notif.message}</span>
                            <span className="header__notif-time">{timeAgo(notif.created_at)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Link to="/" className="header__brand" aria-label="Hannkat & Xio" onClick={closeMenus}>
        <span className="header__brand-top">Hannkat</span>
        <span className="header__brand-dot" aria-hidden="true" />
        <span className="header__brand-bottom">Xio</span>
      </Link>

      <div className="header__side header__side--right">
        <Link
          to="/"
          className="header__icon-btn"
          aria-label="Buscar"
          onClick={() => {
            dispatch(openSearch());
            closeMenus();
          }}
        >
          <SearchIcon />
        </Link>

        <Link to="/cart" className="header__icon-btn" aria-label="Canasta" onClick={closeMenus}>
          <BagIcon />
          {cartCount > 0 && <span className="header__icon-badge">{cartCount}</span>}
        </Link>

        <div className="header__menu-anchor">
          <button
            type="button"
            className="header__icon-btn"
            aria-label="Cuenta"
            onClick={() => {
              setIsAccountOpen((v) => !v);
              setIsNotifOpen(false);
            }}
          >
            <UserIcon />
          </button>

          {isAccountOpen && (
            <div className="header__dropdown header__dropdown--account">
              {user ? (
                <>
                  <span className="header__dropdown-greeting">Hola, {user.full_name}</span>
                  <Link to="/orders" onClick={closeMenus}>
                    Mis pedidos
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin/products" onClick={closeMenus}>
                      Admin
                    </Link>
                  )}
                  <button type="button" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenus}>
                    Iniciar sesión
                  </Link>
                  <Link to="/register" onClick={closeMenus}>
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
