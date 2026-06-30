/**
 * Custom Hook - useTelemetry
 *
 * Centralizes all telemetry logging in one place. Question components and
 * orchestrators use this hook instead of calling telemetry-service directly.
 * This makes telemetry consistent, testable, and easy to modify globally.
 */

import { useCallback } from 'react';
import {
  raiseInteractEvent,
  raiseAssessEvent,
  raiseImpressionEvent,
} from '../services/telemetry-service';

export function useTelemetry() {
  /** Log when a user selects an option/answer. */
  const logOptionSelected = useCallback((questionId: string, answer: string | string[]) => {
    raiseInteractEvent({
      type: 'CHOOSE',
      id: Array.isArray(answer) ? answer.join(',') : String(answer),
      questionId,
    });
  }, []);

  /**
   * Log when an answer is scored/submitted.
   * (`_answer` is part of the call signature but unused by this event.)
   */
  const logAnswerSubmitted = useCallback(
    (questionId: string, _answer: string | string[], score: number, maxScore = 1) => {
      raiseAssessEvent({
        type: 'assess',
        questionId,
        maxScore,
        score,
      });
    },
    [],
  );

  /** Log when a page/section is viewed. */
  const logPageViewed = useCallback((pageId: string) => {
    raiseImpressionEvent({ pageId });
  }, []);

  return {
    logOptionSelected,
    logAnswerSubmitted,
    logPageViewed,
  };
}
