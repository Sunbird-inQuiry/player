import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { MainPlayer } from './MainPlayer';
import type { PlayerConfig } from '../../types';

// The real editor/portal contract: the WHOLE questionset with question content
// embedded in metadata.children (Section A: MCQ + SA; Section B: FTB + REO).
// This drives the full render path (no network) to prove questions actually paint.
const metadata = {
  identifier: 'do_214609811633471488164',
  name: 'Sample question set',
  objectType: 'QuestionSetImage',
  timeLimits: { questionSet: { max: 0, min: 0 } },
  children: [
    {
      identifier: 'do_secA',
      name: 'Section A',
      objectType: 'QuestionSet',
      index: 1,
      children: [
        {
          identifier: 'do_q1',
          name: 'Q1',
          objectType: 'Question',
          primaryCategory: 'Multiple Choice Question',
          qType: 'MCQ',
          index: 1,
          maxScore: 5,
          body: '<div class="mcq-title">Which is the capital of France?</div>',
          interactions: {
            response1: {
              type: 'choice',
              options: [
                { label: { en: 'New York' }, value: 0 },
                { label: { en: 'Paris' }, value: 1 },
              ],
            },
          },
          responseDeclaration: {
            response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 1 } },
          },
        },
        {
          identifier: 'do_q2',
          name: 'Q2',
          objectType: 'Question',
          primaryCategory: 'Subjective Question',
          qType: 'SA',
          index: 2,
          maxScore: 5,
          body: 'When is Independence Day observed in India',
          interactions: {},
          answer: '<div class="answer-body">15th August</div>',
        },
      ],
    },
    {
      identifier: 'do_secB',
      name: 'Section B',
      objectType: 'QuestionSet',
      index: 2,
      children: [
        {
          identifier: 'do_q3',
          name: 'Q3',
          objectType: 'Question',
          primaryCategory: 'FTB Question',
          qType: 'FTB',
          index: 1,
          maxScore: 1,
          body: 'The tree is [[response1]]',
          interactions: { response1: { type: 'text' } },
          responseProcessing: { template: 'MAP_RESPONSE' },
          responseDeclaration: {
            response1: {
              cardinality: 'single',
              type: 'string',
              correctResponse: { value: 'tall' },
              mapping: [{ value: 'tall', score: 1, caseSensitive: false }],
            },
          },
        },
      ],
    },
  ],
};

const cfg: PlayerConfig = { context: {}, config: { language: 'en' }, metadata, data: {} };

const renderPlayer = () =>
  render(
    <QumlProvider playerConfig={cfg}>
      <MainPlayer playerConfig={cfg} />
    </QumlProvider>,
  );

describe('MainPlayer — renders from embedded metadata (portal/editor contract)', () => {
  it('shows the real assessment name on the overview (not the fallback)', () => {
    renderPlayer();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    // Real name proves metadata was consumed (fallback would be "Assessment Overview").
    expect(screen.getByText('Sample question set')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start assessment/i })).toBeInTheDocument();
  });

  it('paints the first question stem + options after entering the assessment', () => {
    renderPlayer();
    fireEvent.click(screen.getByRole('button', { name: /start assessment/i }));
    fireEvent.click(screen.getByRole('button', { name: /start section/i }));
    // The MCQ stem and both option labels actually reach the DOM.
    expect(screen.getByText(/capital of France/i)).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });
});
