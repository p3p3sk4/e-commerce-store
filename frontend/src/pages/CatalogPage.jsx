import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFilterOptions, loadProducts } from '../store/catalogSlice.js';
import { SearchBar } from '../components/SearchBar.jsx';
import { FilterSidebar } from '../components/FilterSidebar.jsx';
import { ProductGrid } from '../components/ProductGrid.jsx';
import './CatalogPage.css';

export function CatalogPage() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.catalog.filters);

  // Categorías y marcas para el sidebar solo se necesitan una vez.
  useEffect(() => {
    dispatch(loadFilterOptions());
  }, [dispatch]);

  // El catálogo se vuelve a pedir cada vez que cambia cualquier filtro
  // (búsqueda, categoría, marca, talla, precio o página).
  useEffect(() => {
    dispatch(loadProducts(filters));
  }, [dispatch, filters]);

  return (
    <div className="catalog-page">
      <h1 className="catalog-page__title">Catálogo</h1>
      <SearchBar />
      <div className="catalog-page__layout">
        <FilterSidebar />
        <ProductGrid />
      </div>
    </div>
  );
}
