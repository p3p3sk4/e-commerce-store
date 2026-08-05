import { useEffect, useState } from 'react';
import { cancelOrderAdmin, completeOrderAdmin, fetchOrdersAdmin } from '../api/adminOrders.js';
import './AdminOrdersPage.css';

const STATUS_LABELS = {
  pendiente_pago: 'Pendiente de pago',
  apartado: 'Apartado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const reload = () => {
    fetchOrdersAdmin(statusFilter || undefined)
      .then(setOrders)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleComplete = async (id) => {
    setBusyId(id);
    try {
      await completeOrderAdmin(id);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('¿Cancelar esta orden?')) return;
    setBusyId(id);
    try {
      await cancelOrderAdmin(id);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-orders">
      <div className="admin-orders__header">
        <h1>Órdenes</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todas</option>
          <option value="pendiente_pago">Pendiente de pago</option>
          <option value="apartado">Apartado</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {error && <p className="admin-orders__error">{error}</p>}
      {!orders && <p>Cargando órdenes...</p>}
      {orders && orders.length === 0 && <p>No hay órdenes con ese filtro.</p>}

      {orders && orders.length > 0 && (
        <table className="admin-orders__table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{order.payment_method}</td>
                <td>
                  <span className={`admin-orders__badge admin-orders__badge--${order.status}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td>${Number(order.total).toFixed(2)}</td>
                <td>{new Date(order.created_at).toLocaleDateString('es-MX')}</td>
                <td className="admin-orders__actions">
                  {['pendiente_pago', 'apartado'].includes(order.status) && (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-btn--primary"
                        disabled={busyId === order.id}
                        onClick={() => handleComplete(order.id)}
                      >
                        Completar
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        disabled={busyId === order.id}
                        onClick={() => handleCancel(order.id)}
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
