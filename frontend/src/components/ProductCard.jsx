import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../store/cartSlice.js';
import { resolveMediaUrl } from '../api/client.js';
import { ImageViewer } from './ImageViewer.jsx';
import './ProductCard.css';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" font-size="16" fill="#999" text-anchor="middle" dominant-baseline="middle">Sin imagen</text></svg>'
  );

function formatPriceRange(variants) {
  if (!variants || variants.length === 0) return 'Precio no disponible';
  const prices = variants.map((variant) => Number(variant.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `$${min.toFixed(2)}`;
  return `$${min.toFixed(2)} – $${max.toFixed(2)}`;
}

function totalAvailable(variants) {
  if (!variants || variants.length === 0) return 0;
  return variants.reduce((sum, variant) => sum + Number(variant.available_quantity), 0);
}

export function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const galleryImages = (product.images || []).map((url) => resolveMediaUrl(url));
  const image = galleryImages.length > 0 ? galleryImages[0] : PLACEHOLDER_IMAGE;
  const variants = product.variants || [];
  const available = totalAvailable(variants);
  const inStock = available > 0;

  const [viewerIndex, setViewerIndex] = useState(null);

  const firstAvailableVariant = useMemo(
    () => variants.find((variant) => variant.available_quantity > 0) || variants[0],
    [variants]
  );
  const [selectedVariantId, setSelectedVariantId] = useState(firstAvailableVariant?.id);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || firstAvailableVariant;

  const [adding, setAdding] = useState(false);

  const ensureLoggedIn = () => {
    if (!user) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!ensureLoggedIn() || !selectedVariant) return;
    setAdding(true);
    await dispatch(addToCart({ variantId: selectedVariant.id, quantity: 1 }));
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!ensureLoggedIn() || !selectedVariant) return;
    setAdding(true);
    await dispatch(addToCart({ variantId: selectedVariant.id, quantity: 1 }));
    setAdding(false);
    navigate('/checkout');
  };

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <img
          src={image}
          alt={product.name}
          className="product-card__image"
          loading="lazy"
          onClick={() => galleryImages.length > 0 && setViewerIndex(0)}
          style={galleryImages.length > 0 ? { cursor: 'zoom-in' } : undefined}
        />
        {!inStock && <span className="product-card__badge">Agotado</span>}
        {galleryImages.length > 1 && (
          <span className="product-card__photo-count">📷 {galleryImages.length}</span>
        )}
      </div>

      {viewerIndex !== null && (
        <ImageViewer
          images={galleryImages}
          index={viewerIndex}
          alt={product.name}
          onClose={() => setViewerIndex(null)}
          onChangeIndex={setViewerIndex}
        />
      )}

      <div className="product-card__body">
        {product.brand && <span className="product-card__brand">{product.brand}</span>}
        <h3 className="product-card__name">{product.name}</h3>
        {product.category && <span className="product-card__category">{product.category}</span>}

        <div className="product-card__sizes">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              disabled={variant.available_quantity <= 0}
              onClick={() => setSelectedVariantId(variant.id)}
              className={`product-card__size ${variant.available_quantity <= 0 ? 'is-unavailable' : ''} ${
                selectedVariant?.id === variant.id ? 'is-selected' : ''
              }`}
            >
              {variant.size}
            </button>
          ))}
        </div>

        <div className="product-card__footer">
          <span className="product-card__price">
            {selectedVariant ? `$${Number(selectedVariant.price).toFixed(2)}` : formatPriceRange(variants)}
          </span>
          <span className="product-card__stock">
            {selectedVariant
              ? `${selectedVariant.available_quantity} disponibles`
              : inStock
                ? `${available} disponibles`
                : 'Sin stock'}
          </span>
        </div>

        <div className="product-card__actions">
          <button
            type="button"
            className="product-card__btn product-card__btn--secondary"
            disabled={!inStock || adding}
            onClick={handleAddToCart}
          >
            Agregar a la canasta
          </button>
          <button
            type="button"
            className="product-card__btn product-card__btn--primary"
            disabled={!inStock || adding}
            onClick={handleBuyNow}
          >
            Comprar
          </button>
        </div>
      </div>
    </article>
  );
}
