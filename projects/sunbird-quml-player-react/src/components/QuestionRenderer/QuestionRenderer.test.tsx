import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QumlProvider } from '../../context/QumlContext';
import { QuestionRenderer } from './QuestionRenderer';
import type { PlayerConfig, Question } from '../../types';

const cfg: PlayerConfig = { context: {}, config: { language: 'en' } };

const mcq = {
  identifier: 'q1',
  body: '<p>Q1</p>',
  primaryCategory: 'multiple choice question',
  maxScore: 1,
  interactions: { response1: { options: [{ value: 0, label: 'Apple' }, { value: 1, label: 'Banana' }] } },
  responseDeclaration: {
    response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
  },
} as Question;

const wrap = (ui: ReactNode) => render(<QumlProvider playerConfig={cfg}>{ui}</QumlProvider>);

describe('QuestionRenderer', () => {
  it('dispatches to the registered component for the question type', () => {
    wrap(<QuestionRenderer question={mcq} />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('shows an error for an unknown question type', () => {
    wrap(<QuestionRenderer question={{ ...mcq, primaryCategory: 'mystery' }} />);
    expect(screen.getByText(/unknown question type/i)).toBeInTheDocument();
  });

  it('shows a message when no question is provided', () => {
    wrap(<QuestionRenderer question={null} />);
    expect(screen.getByText(/no question provided/i)).toBeInTheDocument();
  });
});
