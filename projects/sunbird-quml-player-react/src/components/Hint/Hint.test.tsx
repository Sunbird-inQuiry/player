import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Hint } from './Hint';

describe('Hint', () => {
  it('renders nothing when there is no content', () => {
    const { container } = render(<Hint hints={[]} solutions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the hint button when showHints is set and hints are supplied', () => {
    render(<Hint hints={[{ hint: '<p>Think about Mars.</p>' }]} showHints />);
    const toggle = screen.getByRole('button', { name: /show hint/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /hide hint/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('hides the hint button when showHints is false, even with hint content', () => {
    render(<Hint hints={[{ hint: '<p>Think about Mars.</p>' }]} />);
    expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument();
  });

  it('hides the View Solution button until the learner has interacted', () => {
    render(<Hint solutions={[{ value: '<p>Because iron oxide.</p>' }]} showSolutions />);
    // canViewSolution defaults to false → no solution button yet.
    expect(screen.queryByRole('button', { name: /view solution/i })).not.toBeInTheDocument();
  });

  it('hides the View Solution button when showSolutions is false, even after interaction', () => {
    render(<Hint solutions={[{ value: '<p>Because iron oxide.</p>' }]} canViewSolution />);
    // showSolutions defaults to false → button stays hidden despite interaction + content.
    expect(screen.queryByRole('button', { name: /view solution/i })).not.toBeInTheDocument();
  });

  it('shows the View Solution button once opted in and unlocked, and reveals the solution', () => {
    render(
      <Hint solutions={[{ value: '<p>Because iron oxide.</p>' }]} canViewSolution showSolutions />,
    );
    fireEvent.click(screen.getByRole('button', { name: /view solution/i }));
    expect(screen.getByText(/^solution$/i)).toBeInTheDocument();
  });

  it('falls back to the SA answer as the solution body when opted in and unlocked', () => {
    render(<Hint answer="<p>The model answer.</p>" canViewSolution showSolutions />);
    fireEvent.click(screen.getByRole('button', { name: /view solution/i }));
    expect(screen.getByText(/^solution$/i)).toBeInTheDocument();
  });
});
