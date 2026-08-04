import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAddresses } from '../api/addresses.js';
import { checkout } from '../store/ordersSlice.js';
import { loadCart } from '../store/cartSlice.js';
import './CheckoutPage.css';

const EMPTY_ADDRESS = {
  recipient_name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zip_code: '',
};

export function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const { status, error } = useSelector((state) => state.orders);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('transferencia');

  useEffect(() => {
    dispatch(loadCart());
    fetchAddresses()
      .then(setSavedAddresses)
      .catch(() => setSavedAddresses([]));
  }, [dispatch]);

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handleAddressField = (field) => (event) => {
    setAddressForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const address =
      selectedAddressId === 'new'
        ? { ...addressForm, save: saveAddress }
        : savedAddresses.find((addr) => addr.id === Number(selectedAddressId));

    const result = await dispatch(checkout({ payment_method: paymentMethod, address }));
    if (checkout.fulfilled.match(result)) {
      navigate(`/orders/${result.payload.id}`, { replace: true });
    }
  };

  if (items.length === 0) {
    return (
      <p className="checkout-page__message">
        Tu canasta está vacía. <Link to="/">Ir al catálogo</Link>
      </p>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <section className="checkout-section">
          <h2 className="checkout-section__title">Dirección de envío</h2>

          {savedAddresses.length > 0 && (
            <select
              className="checkout-form__select"
              value={selectedAddressId}
              onChange={(event) => setSelectedAddressId(event.target.value)}
            >
              {savedAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.recipient_name} — {addr.street}, {addr.city}
                </option>
              ))}
              <option value="new">Usar una dirección nueva</option>
            </select>
          )}

          {selectedAddressId === 'new' && (
            <div className="checkout-form__grid">
              <input
                className="checkout-form__input"
                placeholder="Nombre de quien recibe"
                value={addressForm.recipient_name}
                onChange={handleAddressField('recipient_name')}
                required
              />
              <input
                className="checkout-form__input"
                placeholder="Teléfono"
                value={addressForm.phone}
                onChange={handleAddressField('phone')}
                required
              />
              <input
                className="checkout-form__input checkout-form__input--full"
                placeholder="Calle y número"
                value={addressForm.street}
                onChange={handleAddressField('street')}
                required
              />
              <input
                className="checkout-form__input"
                placeholder="Ciudad"
                value={addressForm.city}
                onChange={handleAddressField('city')}
                required
              />
              <input
                className="checkout-form__input"
                placeholder="Estado"
                value={addressForm.state}
                onChange={handleAddressField('state')}
                required
              />
              <input
                className="checkout-form__input"
                placeholder="Código postal"
                value={addressForm.zip_code}
                onChange={handleAddressField('zip_code')}
                required
              />

              <label className="checkout-form__checkbox">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                />
                Guardar esta dirección para la próxima vez
              </label>
            </div>
          )}
        </section>

        <section className="checkout-section">
          <h2 className="checkout-section__title">Método de pago</h2>
          <div className="checkout-form__payment-options">
            <label className={`checkout-form__payment-option ${paymentMethod === 'transferencia' ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name="payment_method"
                value="transferencia"
                checked={paymentMethod === 'transferencia'}
                onChange={() => setPaymentMethod('transferencia')}
              />
              <div>
                <strong>Transferencia</strong>
                <p>Tienes 10 minutos para transferir y subir tu comprobante.</p>
              </div>
            </label>

            <label className={`checkout-form__payment-option ${paymentMethod === 'efectivo' ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name="payment_method"
                value="efectivo"
                checked={paymentMethod === 'efectivo'}
                onChange={() => setPaymentMethod('efectivo')}
              />
              <div>
                <strong>Efectivo</strong>
                <p>Apartamos tu producto sin límite de tiempo; pagas al recibir.</p>
              </div>
            </label>
          </div>
        </section>

        {error && <p className="checkout-form__error">{error}</p>}

        <div className="checkout-form__footer">
          <span className="checkout-form__total">Total: ${total.toFixed(2)}</span>
          <button type="submit" className="checkout-form__submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Procesando...' : 'Confirmar pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}
