import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Hint } from './Hint';

describe('Hint', () => {
  it('renders nothing when there is no content', () => {
    const { container } = render(<Hint hints={[]} solutions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('toggles a hint open and closed', () => {
    render(<Hint hints={[{ value: '<p>Think about Mars.</p>' }]} />);
    const toggle = screen.getByRole('button', { name: /show hint/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /hide hint/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('reveals an SA model answer as the solution', () => {
    render(<Hint answer="<p>The model answer.</p>" />);
    fireEvent.click(screen.getByRole('button', { name: /view solution/i }));
    // Solution panel heading appears
    expect(screen.getByText(/^solution$/i)).toBeInTheDocument();
  });

  it('respects the showSolutions gate', () => {
    render(<Hint answer="hidden" showSolutions={false} />);
    expect(screen.queryByRole('button', { name: /view solution/i })).not.toBeInTheDocument();
  });
});
