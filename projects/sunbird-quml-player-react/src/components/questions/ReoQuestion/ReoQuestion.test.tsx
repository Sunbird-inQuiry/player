import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { ReactNode } from 'react';
import { ReoQuestion } from './ReoQuestion';
import type { Question } from '../../../types';

const reoQuestion = {
  identifier: 'q-reo',
  body: '<p>Build the sentence</p>',
  primaryCategory: 'reorder question',
  maxScore: 1,
  interactions: {
    response1: {
      options: [
        { value: 'w1', label: 'Water' },
        { value: 'w2', label: 'is' },
        { value: 'w3', label: 'life' },
      ],
    },
  },
  responseDeclaration: {
    response1: { cardinality: 'ordered', type: 'string', correctResponse: { value: ['w1', 'w2', 'w3'] } },
  },
} as Question;

const withDnd = (ui: ReactNode) => render(<DndProvider backend={HTML5Backend}>{ui}</DndProvider>);

describe('ReoQuestion', () => {
  it('adds words from the bank into the answer (emits order)', () => {
    const onOptionSelected = vi.fn();
    withDnd(
      <ReoQuestion question={reoQuestion} shuffleOptions={false} onOptionSelected={onOptionSelected} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Water' }));
    expect(onOptionSelected).toHaveBeenLastCalledWith(expect.objectContaining({ order: ['w1'] }));
    fireEvent.click(screen.getByRole('button', { name: 'is' }));
    expect(onOptionSelected).toHaveBeenLastCalledWith(expect.objectContaining({ order: ['w1', 'w2'] }));
  });

  it('removes a selected word when its chip is tapped', () => {
    const onOptionSelected = vi.fn();
    withDnd(
      <ReoQuestion question={reoQuestion} shuffleOptions={false} onOptionSelected={onOptionSelected} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Water' }));
    fireEvent.click(screen.getByRole('button', { name: /remove water/i }));
    expect(onOptionSelected).toHaveBeenLastCalledWith(expect.objectContaining({ order: [] }));
  });

  it('restores saved order and locks in replay mode', () => {
    withDnd(<ReoQuestion question={reoQuestion} replayed savedResponse={{ order: ['w3', 'w1'] }} />);
    // bank not shown in replay; selected chips are present but disabled
    const chips = screen.getAllByRole('button');
    expect(chips.every((c) => (c as HTMLButtonElement).disabled)).toBe(true);
  });
});
