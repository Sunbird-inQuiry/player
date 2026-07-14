import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { MainPlayer } from './MainPlayer';
import type { PlayerConfig } from '../../types';

// Angular parity (main-player.component.ts:249,253,483-485) — maxAttempts is
// host/backend data under `playerConfig.metadata`, not `config`.
const baseData = {
  showTimer: false,
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
};

const enterAssessment = () => {
  fireEvent.click(screen.getByRole('button', { name: /start assessment/i }));
  fireEvent.click(screen.getByRole('button', { name: /start section/i }));
};

const submitAssessment = () => {
  fireEvent.click(screen.getAllByRole('radio')[0]); // answer correctly
  fireEvent.click(screen.getAllByRole('button', { name: /^submit$/i })[0]);
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: /^submit$/i }));
};

describe('MainPlayer — max attempts (Angular parity)', () => {
  it('hides Retake on Results once this attempt is the last one allowed', () => {
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      metadata: { maxAttempts: 1 },
      data: baseData,
    };
    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} />
      </QumlProvider>,
    );
    enterAssessment();
    submitAssessment();
    expect(screen.getByRole('heading', { name: /your results/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retake/i })).not.toBeInTheDocument();
  });

  it('keeps Retake when attempts remain', () => {
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      metadata: { maxAttempts: 3 },
      data: baseData,
    };
    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} />
      </QumlProvider>,
    );
    enterAssessment();
    submitAssessment();
    expect(screen.getByRole('button', { name: /retake/i })).toBeInTheDocument();
  });

  it('emits an exdata isLastAttempt event when the final attempt starts', () => {
    const onPlayerEvent = vi.fn();
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      metadata: { maxAttempts: 1 },
      data: baseData,
    };
    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} onPlayerEvent={onPlayerEvent} />
      </QumlProvider>,
    );
    expect(onPlayerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eid: 'exdata',
        edata: expect.objectContaining({
          currentattempt: 1,
          isLastAttempt: true,
          maxLimitExceeded: false,
        }),
      }),
    );
  });

  it('emits an exdata maxLimitExceeded event when the last attempt is submitted', () => {
    const onPlayerEvent = vi.fn();
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      metadata: { maxAttempts: 1 },
      data: baseData,
    };
    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} onPlayerEvent={onPlayerEvent} />
      </QumlProvider>,
    );
    onPlayerEvent.mockClear();
    enterAssessment();
    submitAssessment();
    expect(onPlayerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eid: 'exdata',
        edata: expect.objectContaining({
          currentattempt: 1,
          isLastAttempt: false,
          maxLimitExceeded: true,
        }),
      }),
    );
  });

  it('does not restrict Retake when maxAttempts is not sent (unlimited)', () => {
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      data: baseData,
    };
    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} />
      </QumlProvider>,
    );
    enterAssessment();
    submitAssessment();
    expect(screen.getByRole('button', { name: /retake/i })).toBeInTheDocument();
  });
});
