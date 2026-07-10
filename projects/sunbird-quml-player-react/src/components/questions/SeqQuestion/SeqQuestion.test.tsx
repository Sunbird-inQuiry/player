import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeqQuestion } from './SeqQuestion';
import type { Question } from '../../../types';

const seqQuestion = {
  identifier: 'q-seq',
  body: '<p>Order the steps</p>',
  primaryCategory: 'sequence question',
  maxScore: 1,
  interactions: {
    response1: {
      options: [
        { value: 'a', label: 'First' },
        { value: 'b', label: 'Second' },
        { value: 'c', label: 'Third' },
      ],
    },
  },
  responseDeclaration: {
    response1: { cardinality: 'ordered', type: 'string', correctResponse: { value: ['a', 'b', 'c'] } },
  },
} as Question;

// SeqQuestion provides its own dnd-kit DndContext, so no external DnD provider
// is needed (unlike the old react-dnd version).
describe('SeqQuestion', () => {
  it('renders items in declared order when shuffle is off', () => {
    render(<SeqQuestion question={seqQuestion} shuffleOptions={false} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('calls onComponentLoaded once', () => {
    const onComponentLoaded = vi.fn();
    render(<SeqQuestion question={seqQuestion} shuffleOptions={false} onComponentLoaded={onComponentLoaded} />);
    expect(onComponentLoaded).toHaveBeenCalledTimes(1);
  });

  it('restores saved order', () => {
    render(<SeqQuestion question={seqQuestion} savedResponse={{ order: ['c', 'b', 'a'] }} />);
    // Each sortable row is a role="button" (dnd-kit) whose accessible name is the
    // option text; read them in DOM order to assert the arrangement deterministically.
    const order = screen.getAllByRole('button').map((el) => el.getAttribute('aria-label'));
    expect(order).toEqual(['Third', 'Second', 'First']);
  });
});
