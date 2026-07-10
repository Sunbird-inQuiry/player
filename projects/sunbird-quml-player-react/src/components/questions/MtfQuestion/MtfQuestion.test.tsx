import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MtfQuestion } from './MtfQuestion';
import type { Question } from '../../../types';

const mtfQuestion = {
  identifier: 'q-mtf',
  body: '<p>Match the pairs</p>',
  primaryCategory: 'match the following question',
  maxScore: 1,
  interactions: {
    response1: {
      options: {
        left: [
          { value: 'A', label: 'France' },
          { value: 'B', label: 'Japan' },
        ],
        right: [
          { value: '1', label: 'Paris' },
          { value: '2', label: 'Tokyo' },
        ],
      },
    },
  },
  responseDeclaration: {
    response1: { cardinality: 'single', type: 'map', correctResponse: { value: { A: '1', B: '2' } } },
  },
} as Question;

// MtfQuestion provides its own dnd-kit DndContext, so no external DnD provider
// is needed (unlike the old react-dnd version).
describe('MtfQuestion', () => {
  it('renders each left prompt with its right answer image (no drop-here slots)', () => {
    render(<MtfQuestion question={mtfQuestion} shuffleOptions={false} />);
    // Left prompts.
    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    // Right images render as draggable cells; no "Drop here" placeholders.
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.queryByText(/drop here/i)).not.toBeInTheDocument();
  });

  it('restores a saved arrangement into the right cells', () => {
    // Saved: A→2 (Tokyo), B→1 (Paris) — i.e. swapped from the natural order.
    render(
      <MtfQuestion question={mtfQuestion} replayed savedResponse={{ matches: { A: '2', B: '1' } }} />,
    );
    const cells = screen.getAllByText(/Paris|Tokyo/);
    // Row order follows left (France, Japan) → Tokyo first, then Paris.
    expect(cells[0]).toHaveTextContent('Tokyo');
    expect(cells[1]).toHaveTextContent('Paris');
  });
});
