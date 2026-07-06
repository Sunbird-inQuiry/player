import type { IconProps } from './types';

/** Clock — "timer / time remaining". */
export function TimerIcon({ size = 24, className = '', title }: IconProps) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };
  return (
    <svg
      className={`icon icon-timer ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
    >
      {title ? <title>{title}</title> : null}
      <path d="M9 2h6" />
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
    </svg>
  );
}
