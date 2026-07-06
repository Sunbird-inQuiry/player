import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { McqQuestion } from './McqQuestion';
import type { Question } from '../../../types';

const singleQuestion = {
  identifier: 'q-mcq',
  body: '<p>Pick one</p>',
  primaryCategory: 'multiple choice question',
  maxScore: 1,
  interactions: {
    response1: {
      options: [
        { value: 0, label: 'Apple' },
        { value: 1, label: 'Banana' },
      ],
    },
  },
  responseDeclaration: {
    response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
  },
} as Question;

describe('McqQuestion', () => {
  it('renders the body and options', () => {
    render(<McqQuestion question={singleQuestion} />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('emits { value } on single select and marks aria-checked', () => {
    const onOptionSelected = vi.fn();
    render(<McqQuestion question={singleQuestion} onOptionSelected={onOptionSelected} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    expect(onOptionSelected).toHaveBeenCalledWith(expect.objectContaining({ value: 0 }));
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('replaces the selection on a second single-select choice', () => {
    const onOptionSelected = vi.fn();
    render(<McqQuestion question={singleQuestion} onOptionSelected={onOptionSelected} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    expect(onOptionSelected).toHaveBeenLastCalledWith(expect.objectContaining({ value: 0 }));
    fireEvent.click(radios[1]);
    expect(onOptionSelected).toHaveBeenLastCalledWith(expect.objectContaining({ value: 1 }));
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onComponentLoaded once', () => {
    const onComponentLoaded = vi.fn();
    render(<McqQuestion question={singleQuestion} onComponentLoaded={onComponentLoaded} />);
    expect(onComponentLoaded).toHaveBeenCalledTimes(1);
  });

  it('restores savedResponse and locks in replay mode', () => {
    const onOptionSelected = vi.fn();
    render(
      <McqQuestion
        question={singleQuestion}
        replayed
        savedResponse={{ value: 1 }}
        onOptionSelected={onOptionSelected}
      />,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toBeDisabled();
    fireEvent.click(radios[0]);
    expect(onOptionSelected).not.toHaveBeenCalled();
  });
});
