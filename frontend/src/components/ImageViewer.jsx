import { useEffect } from 'react';
import './ImageViewer.css';

// images: array de URLs ya resueltas (absolutas). renderExtra(index) permite
// inyectar contenido extra en el pie (ej. el botón de eliminar del admin)
// sin acoplar este componente a esa lógica.
export function ImageViewer({ images, index, alt, onClose, onChangeIndex, renderExtra }) {
  const safeIndex = Math.min(index, images.length - 1);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onChangeIndex((i) => Math.min(i + 1, images.length - 1));
      if (event.key === 'ArrowLeft') onChangeIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose, onChangeIndex]);

  if (images.length === 0) return null;

  return (
    <div className="image-viewer" onClick={onClose}>
      <div className="image-viewer__inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="image-viewer__close" onClick={onClose}>
          × Cerrar
        </button>

        <div className="image-viewer__stage">
          {safeIndex > 0 && (
            <button
              type="button"
              className="image-viewer__nav image-viewer__nav--prev"
              onClick={() => onChangeIndex(safeIndex - 1)}
            >
              ‹
            </button>
          )}
          <img src={images[safeIndex]} alt={alt} className="image-viewer__image" />
          {safeIndex < images.length - 1 && (
            <button
              type="button"
              className="image-viewer__nav image-viewer__nav--next"
              onClick={() => onChangeIndex(safeIndex + 1)}
            >
              ›
            </button>
          )}
        </div>

        <div className="image-viewer__footer">
          <span>
            {safeIndex + 1} / {images.length}
          </span>
          {renderExtra && renderExtra(safeIndex)}
        </div>
      </div>
    </div>
  );
}
