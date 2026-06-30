import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Scoreboard } from './Scoreboard';

describe('Scoreboard', () => {
  it('renders all stat counts', () => {
    render(<Scoreboard correct={5} incorrect={2} partial={1} skipped={3} />);
    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders score / maxScore', () => {
    render(<Scoreboard totalScore={8} maxScore={11} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/\/11/)).toBeInTheDocument();
  });

  it('uses defaults when props are omitted', () => {
    render(<Scoreboard />);
    expect(screen.getByText(/\/100/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quiz summary/i })).toBeInTheDocument();
  });

  it('fires onSubmit when Submit is clicked', () => {
    const onSubmit = vi.fn();
    render(<Scoreboard onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('is exposed as a labelled region (a11y)', () => {
    render(<Scoreboard />);
    expect(screen.getByRole('region', { name: /quiz summary/i })).toBeInTheDocument();
  });
});
