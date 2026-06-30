import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QumlProvider } from '../../context/QumlContext';
import { Alert } from './Alert';
import type { PlayerConfig } from '../../types';

const mockConfig: PlayerConfig = { context: {}, config: { language: 'en' } };
const wrap = (ui: ReactNode) =>
  render(<QumlProvider playerConfig={mockConfig}>{ui}</QumlProvider>);

describe('Alert', () => {
  it('renders the message with role="alert"', () => {
    wrap(<Alert type="correct" message="Well done" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Well done');
  });

  it('shows the correct title per type', () => {
    wrap(<Alert type="correct" />);
    expect(screen.getByText(/correct answer/i)).toBeInTheDocument();
  });

  it.each(['correct', 'incorrect', 'partial', 'info'] as const)(
    'renders the %s variant',
    (type) => {
      wrap(<Alert type={type} message="x" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    },
  );

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    wrap(<Alert type="info" message="x" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows expected-answer details when provided', () => {
    wrap(<Alert type="incorrect" message="x" details="Paris" />);
    expect(screen.getByText(/expected answer/i)).toBeInTheDocument();
    expect(screen.getByText(/Paris/)).toBeInTheDocument();
  });

  it('shows "View Solution" only when showSolution is true and fires its callback', () => {
    const onShowSolution = vi.fn();
    const { rerender } = wrap(<Alert type="incorrect" message="x" />);
    expect(screen.queryByRole('button', { name: /view solution/i })).not.toBeInTheDocument();

    rerender(
      <QumlProvider playerConfig={mockConfig}>
        <Alert type="incorrect" message="x" showSolution onShowSolution={onShowSolution} />
      </QumlProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /view solution/i }));
    expect(onShowSolution).toHaveBeenCalledTimes(1);
  });
});
