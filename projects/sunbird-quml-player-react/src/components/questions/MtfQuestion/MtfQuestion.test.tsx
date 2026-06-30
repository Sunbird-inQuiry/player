import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { ReactNode } from 'react';
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

const withDnd = (ui: ReactNode) => render(<DndProvider backend={HTML5Backend}>{ui}</DndProvider>);

describe('MtfQuestion', () => {
  it('renders left terms with empty drop slots (no select)', () => {
    withDnd(<MtfQuestion question={mtfQuestion} shuffleOptions={false} />);
    expect(screen.getByLabelText('Drop a match for France')).toBeInTheDocument();
    expect(screen.getByLabelText('Drop a match for Japan')).toBeInTheDocument();
    // Right options remain available as draggable cards.
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
  });

  it('restores saved matches into the slot and locks in replay mode', () => {
    withDnd(<MtfQuestion question={mtfQuestion} replayed savedResponse={{ matches: { A: '1' } }} />);
    const slot = screen.getByLabelText(/France: Paris\. Clear match/i);
    expect(slot).toHaveTextContent('Paris');
    expect(slot).toBeDisabled();
  });

  it('clears a match when the filled slot is clicked', () => {
    const onOptionSelected = vi.fn();
    withDnd(
      <MtfQuestion
        question={mtfQuestion}
        shuffleOptions={false}
        savedResponse={{ matches: { A: '1' } }}
        onOptionSelected={onOptionSelected}
      />,
    );
    fireEvent.click(screen.getByLabelText(/France: Paris\. Clear match/i));
    expect(onOptionSelected).toHaveBeenLastCalledWith(expect.objectContaining({ matches: {} }));
  });
});
