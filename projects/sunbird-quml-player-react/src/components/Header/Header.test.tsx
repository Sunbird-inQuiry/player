import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QumlProvider } from '../../context/QumlContext';
import { Header } from './Header';
import type { PlayerConfig } from '../../types';

const mockConfig: PlayerConfig = { context: {}, config: { language: 'en' } };

const wrap = (ui: ReactNode) =>
  render(<QumlProvider playerConfig={mockConfig}>{ui}</QumlProvider>);

describe('Header', () => {
  it('renders the question counter', () => {
    wrap(<Header questionNumber={3} totalQuestions={10} />);
    expect(screen.getByText(/Question 3 of 10/i)).toBeInTheDocument();
  });

  it('shows the timer (mm:ss) when timeRemaining is provided', () => {
    wrap(<Header timeRemaining={65} />);
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('hides the timer when timeRemaining is null', () => {
    wrap(<Header timeRemaining={null} />);
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('disables Previous on the first question', () => {
    wrap(<Header isFirstQuestion />);
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('disables Next on the last question', () => {
    wrap(<Header isLastQuestion />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('emits onPrevious / onNext via callbacks', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    wrap(<Header onPrevious={onPrevious} onNext={onNext} />);
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('does not render a bookmark control', () => {
    wrap(<Header />);
    expect(screen.queryByRole('button', { name: /bookmark/i })).not.toBeInTheDocument();
  });
});
