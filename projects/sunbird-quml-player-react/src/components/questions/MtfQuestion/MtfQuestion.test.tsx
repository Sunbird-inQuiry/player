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
  it('renders left terms with a match select each', () => {
    withDnd(<MtfQuestion question={mtfQuestion} shuffleOptions={false} />);
    expect(screen.getByLabelText('Match for France')).toBeInTheDocument();
    expect(screen.getByLabelText('Match for Japan')).toBeInTheDocument();
  });

  it('emits { matches } when a pairing is made via the select', () => {
    const onOptionSelected = vi.fn();
    withDnd(
      <MtfQuestion question={mtfQuestion} shuffleOptions={false} onOptionSelected={onOptionSelected} />,
    );
    fireEvent.change(screen.getByLabelText('Match for France'), { target: { value: '1' } });
    expect(onOptionSelected).toHaveBeenLastCalledWith(expect.objectContaining({ matches: { A: '1' } }));
    fireEvent.change(screen.getByLabelText('Match for Japan'), { target: { value: '2' } });
    expect(onOptionSelected).toHaveBeenLastCalledWith(
      expect.objectContaining({ matches: { A: '1', B: '2' } }),
    );
  });

  it('restores saved matches and locks in replay mode', () => {
    withDnd(
      <MtfQuestion question={mtfQuestion} replayed savedResponse={{ matches: { A: '1' } }} />,
    );
    const select = screen.getByLabelText('Match for France') as HTMLSelectElement;
    expect(select.value).toBe('1');
    expect(select).toBeDisabled();
  });
});
