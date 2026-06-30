import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Hint } from './Hint';

describe('Hint', () => {
  it('renders nothing when there is no content', () => {
    const { container } = render(<Hint hints={[]} solutions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the hint button whenever hints are supplied (content-driven)', () => {
    render(<Hint hints={[{ hint: '<p>Think about Mars.</p>' }]} />);
    const toggle = screen.getByRole('button', { name: /show hint/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /hide hint/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('hides the View Solution button until the learner has interacted', () => {
    render(<Hint solutions={[{ value: '<p>Because iron oxide.</p>' }]} />);
    // canViewSolution defaults to false → no solution button yet.
    expect(screen.queryByRole('button', { name: /view solution/i })).not.toBeInTheDocument();
  });

  it('shows the View Solution button once unlocked, and reveals the solution', () => {
    render(<Hint solutions={[{ value: '<p>Because iron oxide.</p>' }]} canViewSolution />);
    fireEvent.click(screen.getByRole('button', { name: /view solution/i }));
    expect(screen.getByText(/^solution$/i)).toBeInTheDocument();
  });

  it('falls back to the SA answer as the solution body when unlocked', () => {
    render(<Hint answer="<p>The model answer.</p>" canViewSolution />);
    fireEvent.click(screen.getByRole('button', { name: /view solution/i }));
    expect(screen.getByText(/^solution$/i)).toBeInTheDocument();
  });
});
