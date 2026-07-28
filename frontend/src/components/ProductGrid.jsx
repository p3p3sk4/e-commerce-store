import { useSelector } from 'react-redux';
import { ProductCard } from './ProductCard.jsx';
import './ProductGrid.css';

export function ProductGrid() {
  const { products, status, error } = useSelector((state) => state.catalog);

  if (status === 'loading') {
    return <p className="product-grid__message">Cargando productos...</p>;
  }

  if (status === 'failed') {
    return <p className="product-grid__message product-grid__message--error">{error}</p>;
  }

  if (status === 'succeeded' && products.length === 0) {
    return <p className="product-grid__message">No encontramos productos con esos filtros.</p>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
