import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { ReactNode } from 'react';
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

const withDnd = (ui: ReactNode) => render(<DndProvider backend={HTML5Backend}>{ui}</DndProvider>);

describe('SeqQuestion', () => {
  it('renders items in declared order when shuffle is off', () => {
    withDnd(<SeqQuestion question={seqQuestion} shuffleOptions={false} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('reorders via keyboard nudge and emits { order }', () => {
    const onOptionSelected = vi.fn();
    withDnd(
      <SeqQuestion question={seqQuestion} shuffleOptions={false} onOptionSelected={onOptionSelected} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /move item 1 down/i }));
    expect(onOptionSelected).toHaveBeenLastCalledWith(
      expect.objectContaining({ order: ['b', 'a', 'c'] }),
    );
  });

  it('calls onComponentLoaded once', () => {
    const onComponentLoaded = vi.fn();
    withDnd(<SeqQuestion question={seqQuestion} shuffleOptions={false} onComponentLoaded={onComponentLoaded} />);
    expect(onComponentLoaded).toHaveBeenCalledTimes(1);
  });

  it('restores saved order', () => {
    withDnd(<SeqQuestion question={seqQuestion} savedResponse={{ order: ['c', 'b', 'a'] }} />);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toContain('Third');
    expect(items[2]).toContain('First');
  });
});
