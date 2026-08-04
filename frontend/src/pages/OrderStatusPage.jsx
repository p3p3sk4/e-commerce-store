import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadOrder, submitPaymentProof } from '../store/ordersSlice.js';
import { loadCart } from '../store/cartSlice.js';
import './OrderStatusPage.css';

const STATUS_LABELS = {
  pendiente_pago: 'Pendiente de pago',
  apartado: 'Apartado (pago en efectivo al recibir)',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

function useCountdown(expiresAt) {
  const [remainingMs, setRemainingMs] = useState(() =>
    expiresAt ? new Date(expiresAt).getTime() - Date.now() : null
  );

  useEffect(() => {
    if (!expiresAt) return undefined;
    const intervalId = setInterval(() => {
      setRemainingMs(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, [expiresAt]);

  return remainingMs;
}

function formatCountdown(ms) {
  if (ms == null) return null;
  if (ms <= 0) return 'Tiempo agotado';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function OrderStatusPage() {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, error } = useSelector((state) => state.orders);

  const [file, setFile] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(loadOrder(orderId));
    dispatch(loadCart()); // el checkout vació la canasta del servidor; se refresca el contador
  }, [dispatch, orderId]);

  // Mientras la orden puede seguir cambiando de estado (pago pendiente o
  // apartada), se refresca cada 15s por si el administrador ya la resolvió.
  useEffect(() => {
    if (!currentOrder || !['pendiente_pago', 'apartado'].includes(currentOrder.status)) return undefined;
    const intervalId = setInterval(() => dispatch(loadOrder(orderId)), 15000);
    return () => clearInterval(intervalId);
  }, [dispatch, orderId, currentOrder?.status]);

  const needsProof =
    currentOrder?.payment_method === 'transferencia' &&
    currentOrder?.status === 'pendiente_pago' &&
    !currentOrder?.payment_proof_url;

  const remainingMs = useCountdown(needsProof ? currentOrder.expires_at : null);

  if (!currentOrder) {
    return <p className="order-status__message">Cargando tu orden...</p>;
  }

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    await dispatch(submitPaymentProof({ orderId, file, paymentReference }));
    setUploading(false);
  };

  return (
    <div className="order-status">
      <h1>Orden {currentOrder.order_number}</h1>
      <span className={`order-status__badge order-status__badge--${currentOrder.status}`}>
        {STATUS_LABELS[currentOrder.status] || currentOrder.status}
      </span>

      <section className="order-status__section">
        <h2>Productos</h2>
        <ul className="order-status__items">
          {(currentOrder.items || []).map((item) => (
            <li key={item.id}>
              {item.product_name} (talla {item.variant_size}) × {item.quantity} — $
              {Number(item.unit_price).toFixed(2)}
            </li>
          ))}
        </ul>
        <p className="order-status__total">Total: ${Number(currentOrder.total).toFixed(2)}</p>
      </section>

      <section className="order-status__section">
        <h2>Dirección de envío</h2>
        <p>
          {currentOrder.shipping_recipient_name} — {currentOrder.shipping_street}, {currentOrder.shipping_city},{' '}
          {currentOrder.shipping_state}, C.P. {currentOrder.shipping_zip_code}
        </p>
      </section>

      {currentOrder.payment_method === 'transferencia' && currentOrder.status === 'pendiente_pago' && (
        <section className="order-status__section">
          <h2>Transferencia</h2>
          {remainingMs != null && remainingMs > 0 && (
            <p className="order-status__countdown">
              Tienes <strong>{formatCountdown(remainingMs)}</strong> para transferir y subir tu comprobante.
            </p>
          )}
          {remainingMs != null && remainingMs <= 0 && (
            <p className="order-status__countdown order-status__countdown--expired">
              El tiempo para pagar se agotó. Si ya transferiste, sube tu comprobante de todos modos y
              contáctanos.
            </p>
          )}

          {needsProof ? (
            <form className="order-status__proof-form" onSubmit={handleUpload}>
              <label className="order-status__label">
                Comprobante de pago (imagen)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files[0])}
                  required
                />
              </label>
              <label className="order-status__label">
                Folio o referencia (opcional)
                <input
                  type="text"
                  className="order-status__input"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                />
              </label>
              {error && <p className="order-status__error">{error}</p>}
              <button type="submit" className="order-status__submit" disabled={!file || uploading}>
                {uploading ? 'Subiendo...' : 'Subir comprobante'}
              </button>
            </form>
          ) : (
            <p className="order-status__proof-sent">
              Tu comprobante ya fue recibido{currentOrder.payment_reference && ` (folio ${currentOrder.payment_reference})`}
              . Estamos validando tu pago.
            </p>
          )}
        </section>
      )}

      {currentOrder.payment_method === 'efectivo' && currentOrder.status === 'apartado' && (
        <p className="order-status__cash-note">
          Tu producto está apartado sin límite de tiempo. Pagas en efectivo cuando lo recibas.
        </p>
      )}

      {currentOrder.status === 'completado' && (
        <p className="order-status__success">¡Tu pedido fue confirmado! Gracias por tu compra.</p>
      )}

      {currentOrder.status === 'cancelado' && (
        <p className="order-status__cancelled">Esta orden fue cancelada.</p>
      )}
    </div>
  );
}
