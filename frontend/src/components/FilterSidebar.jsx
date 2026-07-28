import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetFilters, setFilter } from '../store/catalogSlice.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import './FilterSidebar.css';

// Tallas estándar de ropa/accesorios. El backend no expone un endpoint de
// tallas disponibles, así que se listan las más comunes; se puede ajustar
// aquí si el catálogo real usa otro set (ej. tallas numéricas de calzado).
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único'];

function FilterGroup({ title, options, selected, onSelect, getLabel, getValue }) {
  return (
    <fieldset className="filter-sidebar__group">
      <legend className="filter-sidebar__legend">{title}</legend>
      <ul className="filter-sidebar__list">
        <li>
          <button
            type="button"
            className={`filter-sidebar__option ${selected === '' ? 'is-active' : ''}`}
            onClick={() => onSelect('')}
          >
            Todos
          </button>
        </li>
        {options.map((option) => {
          const value = getValue(option);
          return (
            <li key={value}>
              <button
                type="button"
                className={`filter-sidebar__option ${selected === value ? 'is-active' : ''}`}
                onClick={() => onSelect(value)}
              >
                {getLabel(option)}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export function FilterSidebar() {
  const dispatch = useDispatch();
  const { categories, brands, filters } = useSelector((state) => state.catalog);

  const [minPrice, setMinPrice] = useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);
  const debouncedMin = useDebouncedValue(minPrice);
  const debouncedMax = useDebouncedValue(maxPrice);

  useEffect(() => {
    if (debouncedMin !== filters.minPrice) {
      dispatch(setFilter({ key: 'minPrice', value: debouncedMin }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin]);

  useEffect(() => {
    if (debouncedMax !== filters.maxPrice) {
      dispatch(setFilter({ key: 'maxPrice', value: debouncedMax }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMax]);

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    dispatch(resetFilters());
  };

  return (
    <aside className="filter-sidebar">
      <div className="filter-sidebar__header">
        <h2 className="filter-sidebar__title">Filtros</h2>
        <button type="button" className="filter-sidebar__reset" onClick={handleReset}>
          Limpiar
        </button>
      </div>

      <FilterGroup
        title="Categoría"
        options={categories}
        selected={filters.category}
        onSelect={(value) => dispatch(setFilter({ key: 'category', value }))}
        getLabel={(category) => category.name}
        getValue={(category) => category.name}
      />

      <FilterGroup
        title="Marca"
        options={brands}
        selected={filters.brand}
        onSelect={(value) => dispatch(setFilter({ key: 'brand', value }))}
        getLabel={(brand) => brand.name}
        getValue={(brand) => brand.name}
      />

      <FilterGroup
        title="Talla"
        options={SIZES}
        selected={filters.size}
        onSelect={(value) => dispatch(setFilter({ key: 'size', value }))}
        getLabel={(size) => size}
        getValue={(size) => size}
      />

      <fieldset className="filter-sidebar__group">
        <legend className="filter-sidebar__legend">Precio</legend>
        <div className="filter-sidebar__price-range">
          <input
            type="number"
            min="0"
            className="filter-sidebar__price-input"
            placeholder="Mín"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            aria-label="Precio mínimo"
          />
          <span className="filter-sidebar__price-sep">–</span>
          <input
            type="number"
            min="0"
            className="filter-sidebar__price-input"
            placeholder="Máx"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            aria-label="Precio máximo"
          />
        </div>
      </fieldset>
    </aside>
  );
}
