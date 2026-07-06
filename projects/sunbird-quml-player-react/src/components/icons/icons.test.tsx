import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  PreviousIcon,
  NextIcon,
  HintIcon,
  TimerIcon,
  MenuIcon,
  CloseIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from './index';
import type { IconProps } from './index';
import type { ComponentType } from 'react';

const icons: Array<[string, ComponentType<IconProps>]> = [
  ['PreviousIcon', PreviousIcon],
  ['NextIcon', NextIcon],
  ['HintIcon', HintIcon],
  ['TimerIcon', TimerIcon],
  ['MenuIcon', MenuIcon],
  ['CloseIcon', CloseIcon],
  ['ZoomInIcon', ZoomInIcon],
  ['ZoomOutIcon', ZoomOutIcon],
];

describe('icon components', () => {
  it.each(icons)('%s renders an svg using currentColor', (_name, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it.each(icons)('%s applies size to width and height', (_name, Icon) => {
    const { container } = render(<Icon size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it.each(icons)('%s defaults to size 24', (_name, Icon) => {
    const { container } = render(<Icon />);
    expect(container.querySelector('svg')).toHaveAttribute('width', '24');
  });

  it.each(icons)('%s merges a custom className', (_name, Icon) => {
    const { container } = render(<Icon className="custom-x" />);
    expect(container.querySelector('svg')).toHaveClass('custom-x');
  });

  it.each(icons)('%s is decorative (aria-hidden) without a title', (_name, Icon) => {
    const { container } = render(<Icon />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(icons)('%s exposes an accessible label when given a title', (_name, Icon) => {
    const { container } = render(<Icon title="Label" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label', 'Label');
    expect(container.querySelector('title')).toHaveTextContent('Label');
  });
});
