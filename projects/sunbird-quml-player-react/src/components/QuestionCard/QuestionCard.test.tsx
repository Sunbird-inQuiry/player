import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionCard } from './QuestionCard';
import type { Question } from '../../types';

const question: Question = {
  identifier: 'q1',
  body: '',
  primaryCategory: 'multiple choice question',
  maxScore: 1,
};

describe('QuestionCard', () => {
  it('renders category meta and children', () => {
    render(
      <QuestionCard question={question}>
        <p>renderer output</p>
      </QuestionCard>,
    );
    expect(screen.getByText('multiple choice question')).toBeInTheDocument();
    expect(screen.getByText('renderer output')).toBeInTheDocument();
  });

  it('renders an optional footer slot', () => {
    render(
      <QuestionCard question={question} footer={<span>footer slot</span>}>
        <p>body</p>
      </QuestionCard>,
    );
    expect(screen.getByText('footer slot')).toBeInTheDocument();
  });
});
