import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { changeCartQuantity, loadCart, removeFromCart } from '../store/cartSlice.js';
import './CartPage.css';

export function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status, mutating, error } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(loadCart());
  }, [dispatch]);

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  if (status === 'loading') {
    return <p className="cart-page__message">Cargando tu canasta...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h1>Tu canasta</h1>
        <p className="cart-page__message">
          Tu canasta está vacía. <Link to="/">Ir al catálogo</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Tu canasta</h1>
      {error && <p className="cart-page__error">{error}</p>}

      <ul className="cart-page__list">
        {items.map((item) => {
          const availabilityWarning = item.quantity > item.available_quantity;
          return (
            <li key={item.variant_id} className="cart-item">
              <div className="cart-item__info">
                <span className="cart-item__name">{item.product_name}</span>
                <span className="cart-item__size">Talla {item.size}</span>
                {availabilityWarning && (
                  <span className="cart-item__warning">
                    Solo quedan {item.available_quantity} disponibles
                  </span>
                )}
              </div>

              <div className="cart-item__quantity">
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() =>
                    dispatch(changeCartQuantity({ variantId: item.variant_id, quantity: item.quantity - 1 }))
                  }
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() =>
                    dispatch(changeCartQuantity({ variantId: item.variant_id, quantity: item.quantity + 1 }))
                  }
                >
                  +
                </button>
              </div>

              <span className="cart-item__price">${(Number(item.price) * item.quantity).toFixed(2)}</span>

              <button
                type="button"
                className="cart-item__remove"
                disabled={mutating}
                onClick={() => dispatch(removeFromCart(item.variant_id))}
              >
                Quitar
              </button>
            </li>
          );
        })}
      </ul>

      <div className="cart-page__footer">
        <span className="cart-page__total">Total: ${total.toFixed(2)}</span>
        <button type="button" className="cart-page__checkout-btn" onClick={() => navigate('/checkout')}>
          Proceder al pago
        </button>
      </div>
    </div>
  );
}
