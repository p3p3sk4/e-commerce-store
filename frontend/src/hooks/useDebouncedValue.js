import { useEffect, useState } from 'react';

// Retrasa la propagación de un valor que cambia rápido (texto de búsqueda,
// inputs de precio) para no disparar una petición por cada tecla.
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
