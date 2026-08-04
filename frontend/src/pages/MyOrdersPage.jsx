import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../api/orders.js';
import './MyOrdersPage.css';

const STATUS_LABELS = {
  pendiente_pago: 'Pendiente de pago',
  apartado: 'Apartado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export function MyOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="my-orders__message my-orders__message--error">{error}</p>;
  }

  if (!orders) {
    return <p className="my-orders__message">Cargando tus pedidos...</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="my-orders">
        <h1>Mis pedidos</h1>
        <p className="my-orders__message">
          Todavía no tienes pedidos. <Link to="/">Ir al catálogo</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="my-orders">
      <h1>Mis pedidos</h1>
      <ul className="my-orders__list">
        {orders.map((order) => (
          <li key={order.id} className="my-orders__item">
            <Link to={`/orders/${order.id}`} className="my-orders__link">
              <div className="my-orders__main">
                <span className="my-orders__number">{order.order_number}</span>
                <span className="my-orders__date">
                  {new Date(order.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <span className={`my-orders__badge my-orders__badge--${order.status}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <span className="my-orders__total">${Number(order.total).toFixed(2)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
