import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BooleanQuestion } from './BooleanQuestion';
import type { Question } from '../../../types';

const boolQuestion = {
  identifier: 'q-bool-001',
  body: '<p>Is the Earth round?</p>',
  primaryCategory: 'boolean question',
  qType: 'BOOL',
  templateId: 'mcq-boolean',
  maxScore: 1,
  interactions: {
    response1: {
      type: 'choice',
      options: [
        { value: 0, label: { en: '<p>True</p>' } },
        { value: 1, label: { en: '<p>False</p>' } },
      ],
    },
  },
  responseDeclaration: {
    response1: {
      cardinality: 'single',
      type: 'integer',
      correctResponse: { value: 0 },
      mapping: [{ value: 0, score: 1 }],
    },
  },
} as Question;

describe('BooleanQuestion', () => {
  it('renders the question body', () => {
    render(<BooleanQuestion question={boolQuestion} />);
    expect(screen.getByText('Is the Earth round?')).toBeInTheDocument();
  });

  it('renders exactly two option cards with role="radio"', () => {
    render(<BooleanQuestion question={boolQuestion} />);
    const cards = screen.getAllByRole('radio');
    expect(cards).toHaveLength(2);
  });

  it('emits { value } on click and marks the card aria-checked', () => {
    const onOptionSelected = vi.fn();
    render(<BooleanQuestion question={boolQuestion} onOptionSelected={onOptionSelected} />);
    const cards = screen.getAllByRole('radio');
    fireEvent.click(cards[0]); // click "True" (value: 0)
    expect(onOptionSelected).toHaveBeenCalledWith(expect.objectContaining({ value: 0 }));
    expect(cards[0]).toHaveAttribute('aria-checked', 'true');
    expect(cards[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('switches selection to the other card (single cardinality)', () => {
    const onOptionSelected = vi.fn();
    render(<BooleanQuestion question={boolQuestion} onOptionSelected={onOptionSelected} />);
    const cards = screen.getAllByRole('radio');
    fireEvent.click(cards[0]); // True
    fireEvent.click(cards[1]); // False — deselects True
    expect(onOptionSelected).toHaveBeenLastCalledWith(expect.objectContaining({ value: 1 }));
    expect(cards[0]).toHaveAttribute('aria-checked', 'false');
    expect(cards[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onComponentLoaded exactly once', () => {
    const onComponentLoaded = vi.fn();
    render(<BooleanQuestion question={boolQuestion} onComponentLoaded={onComponentLoaded} />);
    expect(onComponentLoaded).toHaveBeenCalledTimes(1);
  });

  it('restores savedResponse on mount', () => {
    render(<BooleanQuestion question={boolQuestion} savedResponse={{ value: 1 }} />);
    const cards = screen.getAllByRole('radio');
    expect(cards[0]).toHaveAttribute('aria-checked', 'false'); // True not selected
    expect(cards[1]).toHaveAttribute('aria-checked', 'true');  // False selected
  });

  it('disables all cards and ignores clicks when replayed=true', () => {
    const onOptionSelected = vi.fn();
    render(
      <BooleanQuestion
        question={boolQuestion}
        replayed={true}
        onOptionSelected={onOptionSelected}
      />,
    );
    const cards = screen.getAllByRole('radio');
    expect(cards[0]).toBeDisabled();
    expect(cards[1]).toBeDisabled();
    fireEvent.click(cards[0]);
    expect(onOptionSelected).not.toHaveBeenCalled();
  });

  it('clears selection when replayed transitions to true', () => {
    const { rerender } = render(
      <BooleanQuestion question={boolQuestion} savedResponse={{ value: 0 }} />,
    );
    const cards = screen.getAllByRole('radio');
    expect(cards[0]).toHaveAttribute('aria-checked', 'true');

    rerender(<BooleanQuestion question={boolQuestion} replayed={true} />);
    expect(cards[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('supports keyboard Enter/Space to select', () => {
    const onOptionSelected = vi.fn();
    render(<BooleanQuestion question={boolQuestion} onOptionSelected={onOptionSelected} />);
    const cards = screen.getAllByRole('radio');
    fireEvent.keyDown(cards[1], { key: 'Enter' });
    expect(onOptionSelected).toHaveBeenCalledWith(expect.objectContaining({ value: 1 }));
  });
});
