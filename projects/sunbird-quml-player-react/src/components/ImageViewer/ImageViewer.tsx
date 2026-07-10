import './image-viewer.css';
import type { ImageZoomState } from './useImageZoom';

/**
 * Full-screen image viewer overlay.
 * Mirrors Angular section-player.component.html:143-153 (image-viewer overlay,
 * close button, zoom-in/out) and applies the portrait/landscape/neutral class to
 * the enlarged image, matching setImageZoom()'s #imageModal handling.
 */
interface ImageViewerProps {
  state: ImageZoomState;
  onClose: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function ImageViewer({ state, onClose, onZoomIn, onZoomOut }: ImageViewerProps) {
  if (!state.open) return null;

  return (
    <div className="image-viewer__overlay">
      <button type="button" className="image-viewer__close" aria-label="Close" onClick={onClose} />
      <div className="image-viewer__container">
        <img
          className={`image-viewer__img ${state.orientation}`}
          src={state.src}
          alt="Zoomed"
          style={{ width: `${state.zoom}%`, height: `${state.zoom}%` }}
        />
      </div>
      <div className="image-viewer__zoom">
        <button type="button" className="image-viewer__zoomin" aria-label="Zoom in" onClick={onZoomIn}>
          +
        </button>
        <button type="button" className="image-viewer__zoomout" aria-label="Zoom out" onClick={onZoomOut}>
          &minus;
        </button>
      </div>
    </div>
  );
}
