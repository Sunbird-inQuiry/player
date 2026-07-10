import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { MainPlayer } from './MainPlayer';
import { initializeTelemetry } from '../../services/telemetry-service';
import type { PlayerConfig, TelemetryContext } from '../../types';

// Reproduces the real crash condition: a host telemetry SDK that has NO logEvent
// (portal/editor) — set BEFORE interacting. Then answer a reorder question (whose
// drag/tap/nudge fire onOptionSelected → telemetry) and assert nothing throws.
const metadata = {
  identifier: 'do_qs',
  name: 'QS',
  objectType: 'QuestionSetImage',
  children: [
    {
      identifier: 'do_sec',
      name: 'Section',
      objectType: 'QuestionSet',
      index: 1,
      children: [
        {
          identifier: 'do_reo',
          name: 'Q',
          objectType: 'Question',
          primaryCategory: 'Reorder Question',
          qType: 'REO',
          index: 1,
          maxScore: 1,
          body: '<div class="order-title">Reorder the sentence</div>',
          interactions: {
            response1: {
              type: 'order',
              options: [
                { value: 'A', label: 'Book' },
                { value: 'B', label: 'is' },
                { value: 'C', label: 'on' },
              ],
            },
          },
          responseDeclaration: {
            response1: {
              cardinality: 'ordered',
              type: 'string',
              correctResponse: { value: ['A', 'B', 'C'] },
            },
          },
        },
      ],
    },
  ],
};

const cfg: PlayerConfig = { context: {}, config: { language: 'en' }, metadata, data: {} };

describe('MainPlayer — reorder interaction with a logEvent-less telemetry SDK', () => {
  beforeEach(() => {
    // Host SDK exposes initialize but NOT logEvent — exactly the failing case.
    (window as any).EkTelemetry = { initialize: vi.fn() };
    initializeTelemetry({} as TelemetryContext);
  });
  afterEach(() => {
    delete (window as any).EkTelemetry;
    vi.restoreAllMocks();
  });

  it('answering a reorder question does NOT throw (regression: Mp.logEvent is not a function)', () => {
    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} />
      </QumlProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start assessment/i }));
    fireEvent.click(screen.getByRole('button', { name: /start section/i }));

    // The reorder question renders; tapping a bank word changes the answer, which
    // fires onOptionSelected → handleQuestionAnswer → logOptionSelected/
    // logAnswerSubmitted → raiseInteractEvent/raiseAssessEvent → the SDK path.
    // Before the fix this threw synchronously inside the click; now it must not.
    expect(() => fireEvent.click(screen.getByText('Book'))).not.toThrow();
    expect(() => fireEvent.click(screen.getByText('is'))).not.toThrow();
  });
});
