import type { IconProps } from './types';

/** Box with a plus — "attempts left" stat. */
export function AttemptsIcon({ size = 24, className = '', title }: IconProps) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };
  return (
    <svg
      className={`icon icon-attempts ${className}`.trim()}
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
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
    </svg>
  );
}
