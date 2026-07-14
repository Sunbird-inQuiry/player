import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { MainPlayer } from './MainPlayer';
import type { PlayerConfig } from '../../types';

// Angular parity (section-player.component.ts:232-235, main-player.component.ts
// :172,257,488-493) — `showTimer` only gates the LIVE widget's visibility; it
// has no bearing on whether the clock is tracked, whether a time limit is
// enforced, or whether the results screen can report duration. These configs
// all set `showTimer: false` (or omit it) while still exercising the clock.

const mcq = (id: string) => ({
  identifier: id,
  body: `<p>${id}</p>`,
  primaryCategory: 'Multiple Choice Question',
  interactions: { response1: { options: [{ value: 0, label: 'Apple' }, { value: 1, label: 'Banana' }] } },
  responseDeclaration: {
    response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
  },
});

const enterAssessment = () => {
  fireEvent.click(screen.getByRole('button', { name: /start assessment/i }));
  fireEvent.click(screen.getByRole('button', { name: /start section/i }));
};

describe('MainPlayer — showTimer/summaryType parity (Angular)', () => {
  it('auto-submits at time-limit expiry even when showTimer is false (hidden limit is still enforced)', () => {
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      data: {
        showTimer: false,
        timeLimits: { questionSet: { max: 2, min: 0 } },
        sections: [{ identifier: 's1', name: 'Section 1', children: [mcq('q1')] }],
      },
    };
    vi.useFakeTimers();
    try {
      render(
        <QumlProvider playerConfig={cfg}>
          <MainPlayer playerConfig={cfg} />
        </QumlProvider>,
      );
      enterAssessment();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      // No visible countdown — showTimer is false.
      expect(screen.queryByRole('timer')).not.toBeInTheDocument();
      // Past the 2s limit → auto-submit, no confirmation needed.
      act(() => vi.advanceTimersByTime(2100));
      expect(screen.getByRole('heading', { name: /your results/i })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports duration on Results when showTimer is false and summaryType allows it', () => {
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      data: {
        showTimer: false,
        summaryType: 'Score and Duration',
        sections: [{ identifier: 's1', name: 'Section 1', children: [mcq('q1')] }],
      },
    };
    vi.useFakeTimers();
    try {
      render(
        <QumlProvider playerConfig={cfg}>
          <MainPlayer playerConfig={cfg} />
        </QumlProvider>,
      );
      enterAssessment();
      act(() => vi.advanceTimersByTime(3000)); // 3s elapsed, count-up mode (no time limit)
      fireEvent.click(screen.getAllByRole('radio')[0]);
      fireEvent.click(screen.getAllByRole('button', { name: /^submit$/i })[0]);
      const dialog = screen.getByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: /^submit$/i }));
      expect(screen.getByRole('heading', { name: /your results/i })).toBeInTheDocument();
      expect(screen.getByText(/time taken/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
