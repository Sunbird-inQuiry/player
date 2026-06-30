import { useState } from 'react';
import { t, readI18n } from '../../i18n/translations';
import { QuestionBody } from '../QuestionBody/QuestionBody';
import { HintIcon } from '../icons';
import type { I18nValue } from '../../types';
import styles from './Hint.module.scss';

/**
 * Hint + Solution reveal UI (spec §6.8).
 *
 * Pure UI over already-normalized question content:
 * - "Show Hint" appears whenever the backend supplies `hints` (content-driven).
 * - "View Solution" appears only once `canViewSolution` is true — i.e. after the
 *   learner has interacted with the question (gated by the orchestrator).
 * No scoring, no Context mutation. HTML/KaTeX is rendered via QuestionBody.
 */
export interface HintProps {
  hints?: unknown[];
  solutions?: unknown[];
  /** SA model answer (used as the solution body when no `solutions` are sent). */
  answer?: string | I18nValue;
  /** Unlock the View Solution button — set once the learner has interacted. */
  canViewSolution?: boolean;
  language?: string;
}

/** Extract renderable HTML from a QuML hint/solution array entry. */
function extractHtml(entry: unknown): string {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    const obj = entry as Record<string, unknown>;
    const candidate = obj.value ?? obj.body ?? obj.solution ?? obj.hint;
    if (typeof candidate === 'string') return candidate;
  }
  return '';
}

export function Hint({
  hints = [],
  solutions = [],
  answer,
  canViewSolution = false,
  language = 'en',
}: HintProps) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const hintHtml = hints.map(extractHtml).filter(Boolean);
  const solutionHtml = solutions.map(extractHtml).filter(Boolean);
  const answerText = readI18n(answer, language);

  // Hint button: shown whenever the backend sent hints.
  const hasHints = hintHtml.length > 0;
  // Solution button: shown only after the learner has interacted (canViewSolution)
  // AND there is solution/answer content to reveal.
  const hasSolution = canViewSolution && (solutionHtml.length > 0 || Boolean(answerText));

  if (!hasHints && !hasSolution) return null;

  return (
    <div className={styles.hint}>
      <div className={styles.actions}>
        {hasHints && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowHint((s) => !s)}
            aria-expanded={showHint}
          >
            <HintIcon size={16} />
            {t(language, showHint ? 'HIDE_HINT' : 'SHOW_HINT')}
          </button>
        )}
        {hasSolution && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowSolution((s) => !s)}
            aria-expanded={showSolution}
          >
            {t(language, 'VIEW_SOLUTION')}
          </button>
        )}
      </div>

      {showHint && hasHints && (
        <div className={`${styles.panel} ${styles.hintPanel}`}>
          <h3 className={styles.panelHeading}>{t(language, 'HINT')}</h3>
          {hintHtml.map((html, i) => (
            <QuestionBody key={i} question={{ body: html }} language={language} />
          ))}
        </div>
      )}

      {showSolution && hasSolution && (
        <div className={`${styles.panel} ${styles.solutionPanel}`}>
          <h3 className={styles.panelHeading}>{t(language, 'SOLUTION')}</h3>
          {solutionHtml.map((html, i) => (
            <QuestionBody key={i} question={{ body: html }} language={language} />
          ))}
          {solutionHtml.length === 0 && answerText && (
            <QuestionBody question={{ body: answerText }} language={language} />
          )}
        </div>
      )}
    </div>
  );
}
