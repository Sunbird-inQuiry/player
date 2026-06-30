import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QumlProvider } from '../../context/QumlContext';
import { SectionPlayer } from './SectionPlayer';
import type { PlayerConfig, Question, Section } from '../../types';

const cfg: PlayerConfig = { context: {}, config: { language: 'en' } };

const mcq = (id: string): Question =>
  ({
    identifier: id,
    body: `<p>${id}</p>`,
    primaryCategory: 'multiple choice question',
    maxScore: 1,
    interactions: { response1: { options: [{ value: 0, label: 'Apple' }, { value: 1, label: 'Banana' }] } },
    responseDeclaration: {
      response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
    },
  }) as Question;

const section: Section = {
  identifier: 's1',
  name: 'Section 1',
  children: [mcq('q1'), mcq('q2')],
  timeLimits: { max: 0, min: 0 },
  allowSkip: true,
  shuffle: false,
};

const wrap = (ui: ReactNode) => render(<QumlProvider playerConfig={cfg}>{ui}</QumlProvider>);

describe('SectionPlayer', () => {
  it('renders the first question with a counter', () => {
    wrap(<SectionPlayer section={section} />);
    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument();
  });

  it('navigates to the next question and shows Submit on the last', () => {
    wrap(<SectionPlayer section={section} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Question 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('persists an answer across navigation (Context restore)', () => {
    wrap(<SectionPlayer section={section} />);
    // answer Q1
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
    // go to Q2 and back
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    // Q1's answer restored from Context
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onSectionEnd when Submit is clicked', () => {
    const onSectionEnd = vi.fn();
    wrap(<SectionPlayer section={section} onSectionEnd={onSectionEnd} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(onSectionEnd).toHaveBeenCalledTimes(1);
  });
});
