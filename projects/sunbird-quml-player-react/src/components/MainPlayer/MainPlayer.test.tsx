import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { MainPlayer } from './MainPlayer';
import type { PlayerConfig } from '../../types';

// Raw-ish embedded config (MainPlayer normalizes via the transformation service).
const cfg: PlayerConfig = {
  context: {},
  config: { language: 'en', showFeedback: true },
  data: {
    sections: [
      {
        identifier: 's1',
        name: 'Section 1',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        children: [
          {
            identifier: 'q1',
            body: '<p>Q1</p>',
            primaryCategory: 'Multiple Choice Question',
            interactions: { response1: { options: [{ value: 0, label: 'Apple' }, { value: 1, label: 'Banana' }] } },
            responseDeclaration: {
              response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
            },
          },
        ],
      },
    ],
  },
};

const renderPlayer = () =>
  render(
    <QumlProvider playerConfig={cfg}>
      <MainPlayer playerConfig={cfg} />
    </QumlProvider>,
  );

/** Advance the Phase 6 flow: overview → sectionIntro → assessment. */
const enterAssessment = () => {
  fireEvent.click(screen.getByRole('button', { name: /start assessment/i }));
  fireEvent.click(screen.getByRole('button', { name: /start section/i }));
};

describe('MainPlayer', () => {
  it('shows the Assessment Overview first with a Start CTA', () => {
    renderPlayer();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start assessment/i })).toBeInTheDocument();
    // Question chrome is not rendered until the assessment stage.
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });

  it('renders the section intro then the first question after Start/Begin', () => {
    renderPlayer();
    enterAssessment();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 1/i)).toBeInTheDocument();
  });

  it('shows a feedback toast when configured and an answer is selected', () => {
    renderPlayer();
    enterAssessment();
    fireEvent.click(screen.getAllByRole('radio')[0]); // correct option (value 0)
    expect(screen.getByRole('status')).toHaveTextContent(/correct answer/i);
  });

  it('shows the scoreboard summary after submitting', () => {
    renderPlayer();
    enterAssessment();
    fireEvent.click(screen.getAllByRole('radio')[0]); // answer correctly
    // Header "Submit" ends the assessment (footer also has one on the last question).
    fireEvent.click(screen.getAllByRole('button', { name: /^submit$/i })[0]);
    expect(screen.getByRole('region', { name: /quiz summary/i })).toBeInTheDocument();
    expect(screen.getByText(/\/1/)).toBeInTheDocument(); // totalScore / maxScore
  });
});
