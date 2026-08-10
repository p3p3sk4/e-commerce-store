import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSearch, loadFilterOptions, loadProducts } from '../store/catalogSlice.js';
import { SearchBar } from '../components/SearchBar.jsx';
import { FilterSidebar } from '../components/FilterSidebar.jsx';
import { ProductGrid } from '../components/ProductGrid.jsx';
import './CatalogPage.css';

const FILTER_KEYS = ['category', 'brand', 'size', 'minPrice', 'maxPrice'];

export function CatalogPage() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.catalog.filters);
  const isSearchOpen = useSelector((state) => state.catalog.isSearchOpen);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Categorías y marcas para el sidebar solo se necesitan una vez.
  useEffect(() => {
    dispatch(loadFilterOptions());
  }, [dispatch]);

  // El catálogo se vuelve a pedir cada vez que cambia cualquier filtro
  // (búsqueda, categoría, marca, talla, precio o página).
  useEffect(() => {
    dispatch(loadProducts(filters));
  }, [dispatch, filters]);

  // Para el contador del botón "Filtros" en móvil.
  const activeFilterCount = useMemo(
    () => FILTER_KEYS.filter((key) => filters[key]).length,
    [filters]
  );

  return (
    <div className="catalog-page">
      <h1 className="catalog-page__title">Catálogo</h1>

      <div className="catalog-page__toolbar">
        {isSearchOpen && (
          <div className="catalog-page__search-row">
            <SearchBar autoFocus />
            <button
              type="button"
              className="catalog-page__search-close"
              aria-label="Cerrar búsqueda"
              onClick={() => dispatch(closeSearch())}
            >
              ×
            </button>
          </div>
        )}
        <button
          type="button"
          className="catalog-page__filter-btn"
          onClick={() => setIsFilterOpen(true)}
        >
          Filtros
          {activeFilterCount > 0 && (
            <span className="catalog-page__filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div className="catalog-page__layout">
        <div className={`catalog-page__filters ${isFilterOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            className="catalog-page__filters-close"
            onClick={() => setIsFilterOpen(false)}
          >
            × Cerrar
          </button>
          <FilterSidebar />
        </div>

        {isFilterOpen && (
          <div className="catalog-page__overlay" onClick={() => setIsFilterOpen(false)} />
        )}

        <ProductGrid />
      </div>
    </div>
  );
}
