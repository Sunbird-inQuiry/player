/** Shared props for all presentational icon components. */
export interface IconProps {
  /** Pixel size for both width and height. Default 24. */
  size?: number;
  /** Extra class name(s) to apply to the <svg>. */
  className?: string;
  /** Accessible label. When provided, the icon is exposed to AT; otherwise it is decorative (aria-hidden). */
  title?: string;
}
