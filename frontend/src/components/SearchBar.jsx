import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter } from '../store/catalogSlice.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import './SearchBar.css';

export function SearchBar() {
  const dispatch = useDispatch();
  const search = useSelector((state) => state.catalog.filters.search);
  const [value, setValue] = useState(search);
  const debouncedValue = useDebouncedValue(value);

  useEffect(() => {
    if (debouncedValue !== search) {
      dispatch(setFilter({ key: 'search', value: debouncedValue }));
    }
    // Solo reacciona a cambios del valor local, no a `search` (evita eco).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <div className="search-bar">
      <input
        type="search"
        className="search-bar__input"
        placeholder="Buscar productos por nombre..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Buscar productos"
      />
    </div>
  );
}
