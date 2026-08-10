import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadFavorites, toggleFavorite } from '../store/favoritesSlice.js';
import { resolveMediaUrl } from '../api/client.js';
import { HeartIcon } from '../components/icons.jsx';
import './FavoritesPage.css';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" font-size="16" fill="#999" text-anchor="middle" dominant-baseline="middle">Sin imagen</text></svg>'
  );

function formatPriceRange(min, max) {
  if (min == null) return 'Precio no disponible';
  const minN = Number(min);
  const maxN = Number(max);
  if (minN === maxN) return `$${minN.toFixed(2)}`;
  return `$${minN.toFixed(2)} – $${maxN.toFixed(2)}`;
}

export function FavoritesPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.favorites);

  useEffect(() => {
    dispatch(loadFavorites());
  }, [dispatch]);

  if (status === 'loading') {
    return <p className="favorites-page__message">Cargando tus favoritos...</p>;
  }

  return (
    <div className="favorites-page">
      <h1>Tus favoritos</h1>

      {items.length === 0 ? (
        <p className="favorites-page__message">
          Todavía no has agregado nada a favoritos. <Link to="/">Ir al catálogo</Link>
        </p>
      ) : (
        <div className="favorites-grid">
          {items.map((product) => (
            <article key={product.id} className="favorite-card">
              <div className="favorite-card__image-wrap">
                <img
                  src={product.image_url ? resolveMediaUrl(product.image_url) : PLACEHOLDER_IMAGE}
                  alt={product.name}
                  className="favorite-card__image"
                />
                <button
                  type="button"
                  className="favorite-card__remove"
                  aria-label="Quitar de favoritos"
                  onClick={() => dispatch(toggleFavorite({ productId: product.id, isFavorite: true }))}
                >
                  <HeartIcon filled />
                </button>
              </div>
              <div className="favorite-card__body">
                {product.brand && <span className="favorite-card__brand">{product.brand}</span>}
                <h3 className="favorite-card__name">{product.name}</h3>
                <span className="favorite-card__price">
                  {formatPriceRange(product.min_price, product.max_price)}
                </span>
                <span className="favorite-card__stock">
                  {Number(product.stock_quantity) > 0 ? 'Disponible' : 'Agotado'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
