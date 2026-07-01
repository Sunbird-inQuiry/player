import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
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

  it('does not flash feedback on selection; proceeds (non-blocking) on Submit', () => {
    vi.useFakeTimers();
    try {
      renderPlayer();
      enterAssessment();
      // Selecting an option must NOT flash feedback mid-answer.
      fireEvent.click(screen.getAllByRole('radio')[1]); // wrong option (value 1)
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      // Section Submit shows feedback briefly, then proceeds even on a wrong
      // answer (non-blocking) → the end-of-assessment confirm dialog opens.
      const submits = screen.getAllByRole('button', { name: /^submit$/i });
      fireEvent.click(submits[submits.length - 1]); // section-level submit
      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens the submit dialog, then shows results on confirm', () => {
    renderPlayer();
    enterAssessment();
    fireEvent.click(screen.getAllByRole('radio')[0]); // answer correctly
    // Header "Submit" opens the confirmation dialog (Phase 7).
    fireEvent.click(screen.getAllByRole('button', { name: /^submit$/i })[0]);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // Confirm inside the dialog → Results screen with the reused Scoreboard.
    fireEvent.click(within(dialog).getByRole('button', { name: /^submit$/i }));
    expect(screen.getByRole('region', { name: /quiz summary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /your results/i })).toBeInTheDocument();
  });

  it('returns to overview on retake', () => {
    renderPlayer();
    enterAssessment();
    fireEvent.click(screen.getAllByRole('button', { name: /^submit$/i })[0]);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /^submit$/i }));
    fireEvent.click(screen.getByRole('button', { name: /retake/i }));
    expect(screen.getByRole('button', { name: /start assessment/i })).toBeInTheDocument();
  });
});
