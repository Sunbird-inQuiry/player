import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { MainPlayer } from './MainPlayer';
import type { PlayerConfig } from '../../types';

// Embedded single-question config, mirroring what the editor's single-question
// preview sends. `showStartPage` / `requiresSubmit` live on the questionset
// metadata (here, alongside the embedded sections → metadata === data).
const buildConfig = (overrides: {
  showStartPage?: string;
  requiresSubmit?: string;
  showSectionIntro?: boolean;
}): PlayerConfig => ({
  context: {},
  config: {
    language: 'en',
    showFeedback: true,
    ...(overrides.showSectionIntro !== undefined
      ? { showSectionIntro: overrides.showSectionIntro }
      : {}),
  },
  data: {
    ...(overrides.showStartPage !== undefined ? { showStartPage: overrides.showStartPage } : {}),
    ...(overrides.requiresSubmit !== undefined ? { requiresSubmit: overrides.requiresSubmit } : {}),
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
            interactions: {
              response1: { options: [{ value: 0, label: 'Apple' }, { value: 1, label: 'Banana' }] },
            },
            responseDeclaration: {
              response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
            },
          },
        ],
      },
    ],
  },
});

const renderPlayer = (cfg: PlayerConfig) =>
  render(
    <QumlProvider playerConfig={cfg}>
      <MainPlayer playerConfig={cfg} />
    </QumlProvider>,
  );

describe('MainPlayer — preview parity (showStartPage / requiresSubmit)', () => {
  it('showStartPage:"No" lands directly on the question (skips overview AND section intro — Angular parity)', () => {
    // Section intros are enabled by default (no showSectionIntro), yet the entry
    // still bypasses both the overview and the intro screen.
    renderPlayer(buildConfig({ showStartPage: 'No' }));
    expect(screen.queryByRole('button', { name: /start assessment/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start section/i })).not.toBeInTheDocument();
    // Straight into the first question.
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 1/i)).toBeInTheDocument();
  });

  it('normal content still shows the overview then the section intro (feature intact)', () => {
    renderPlayer(buildConfig({})); // no showStartPage → default flow
    // 1. Overview first.
    const start = screen.getByRole('button', { name: /start assessment/i });
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    // 2. Start → section intro (intros default on, NOT skipped for normal content).
    fireEvent.click(start);
    const begin = screen.getByRole('button', { name: /start section/i });
    // 3. Begin → the question.
    fireEvent.click(begin);
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('requiresSubmit:"No" submits straight to results with no confirmation dialog', () => {
    vi.useFakeTimers();
    try {
      // Land directly on the question (showStartPage/showSectionIntro skipped)
      // so we can exercise the submit path in isolation.
      renderPlayer(
        buildConfig({ requiresSubmit: 'No', showStartPage: 'No', showSectionIntro: false }),
      );
      // On the only question; the bottom action is the final Submit.
      const submits = screen.getAllByRole('button', { name: /^submit$/i });
      fireEvent.click(submits[submits.length - 1]);
      act(() => vi.advanceTimersByTime(1000)); // feedback dwell then proceed
      // No confirmation dialog — straight to the results screen.
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /review all answers/i })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
