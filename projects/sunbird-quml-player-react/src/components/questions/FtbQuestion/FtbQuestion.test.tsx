import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FtbQuestion } from './FtbQuestion';
import type { Question } from '../../../types';

const ftbQuestion = {
  identifier: 'q-ftb',
  body: 'The capital of France is [[response1]] and of Italy is [[response2]].',
  primaryCategory: 'fill in the blank question',
  maxScore: 2,
  responseDeclaration: {
    response1: { cardinality: 'single', type: 'string', correctResponse: { value: 'Paris' } },
    response2: { cardinality: 'single', type: 'string', correctResponse: { value: 'Rome' } },
  },
} as Question;

describe('FtbQuestion', () => {
  it('renders one input per blank', () => {
    render(<FtbQuestion question={ftbQuestion} />);
    expect(screen.getByLabelText('Blank 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Blank 2')).toBeInTheDocument();
  });

  it('emits { responses } keyed by responseN on input', () => {
    const onOptionSelected = vi.fn();
    render(<FtbQuestion question={ftbQuestion} onOptionSelected={onOptionSelected} />);
    fireEvent.change(screen.getByLabelText('Blank 1'), { target: { value: 'Paris' } });
    expect(onOptionSelected).toHaveBeenLastCalledWith(
      expect.objectContaining({ responses: { response1: 'Paris' } }),
    );
    fireEvent.change(screen.getByLabelText('Blank 2'), { target: { value: 'Rome' } });
    expect(onOptionSelected).toHaveBeenLastCalledWith(
      expect.objectContaining({ responses: { response1: 'Paris', response2: 'Rome' } }),
    );
  });

  it('calls onGoToNext when Enter is pressed in the last blank', () => {
    const onGoToNext = vi.fn();
    render(<FtbQuestion question={ftbQuestion} onGoToNext={onGoToNext} />);
    fireEvent.keyDown(screen.getByLabelText('Blank 2'), { key: 'Enter' });
    expect(onGoToNext).toHaveBeenCalledTimes(1);
  });

  it('restores savedResponse and locks in replay mode', () => {
    const onOptionSelected = vi.fn();
    render(
      <FtbQuestion
        question={ftbQuestion}
        replayed
        savedResponse={{ responses: { response1: 'Paris' } }}
        onOptionSelected={onOptionSelected}
      />,
    );
    expect(screen.getByLabelText('Blank 1')).toHaveValue('Paris');
    expect(screen.getByLabelText('Blank 1')).toBeDisabled();
  });
});
