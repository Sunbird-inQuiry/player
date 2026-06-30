import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { Toast } from './Toast';
import type { ReactNode } from 'react';

const wrap = (ui: ReactNode) => render(<QumlProvider>{ui}</QumlProvider>);

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the type label and message as a status region', () => {
    wrap(<Toast type="incorrect" message="Try again" duration={0} />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent(/incorrect answer/i);
    expect(toast).toHaveTextContent('Try again');
  });

  it('auto-dismisses after the duration', () => {
    const onClose = vi.fn();
    wrap(<Toast type="correct" message="Nice" onClose={onClose} duration={3000} />);
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(3000));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on the close button', () => {
    const onClose = vi.fn();
    wrap(<Toast type="info" message="Hi" onClose={onClose} duration={0} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
