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
  const image = product.images && product.images.length > 0 ? product.images[0] : PLACEHOLDER_IMAGE;
  const available = totalAvailable(product.variants);
  const inStock = available > 0;

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <img src={image} alt={product.name} className="product-card__image" loading="lazy" />
        {!inStock && <span className="product-card__badge">Agotado</span>}
      </div>

      <div className="product-card__body">
        {product.brand && <span className="product-card__brand">{product.brand}</span>}
        <h3 className="product-card__name">{product.name}</h3>
        {product.category && <span className="product-card__category">{product.category}</span>}

        <div className="product-card__sizes">
          {(product.variants || []).map((variant) => (
            <span
              key={variant.id}
              className={`product-card__size ${variant.available_quantity <= 0 ? 'is-unavailable' : ''}`}
            >
              {variant.size}
            </span>
          ))}
        </div>

        <div className="product-card__footer">
          <span className="product-card__price">{formatPriceRange(product.variants)}</span>
          <span className="product-card__stock">{inStock ? `${available} disponibles` : 'Sin stock'}</span>
        </div>

        <div className="product-card__actions">
          {/* Se conectan a la canasta/checkout en el siguiente paso del frontend. */}
          <button type="button" className="product-card__btn product-card__btn--secondary" disabled={!inStock}>
            Agregar a la canasta
          </button>
          <button type="button" className="product-card__btn product-card__btn--primary" disabled={!inStock}>
            Comprar
          </button>
        </div>
      </div>
    </article>
  );
}
