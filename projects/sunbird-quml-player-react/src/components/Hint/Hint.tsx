import { useState } from 'react';
import { t, readI18n } from '../../i18n/translations';
import { QuestionBody } from '../QuestionBody/QuestionBody';
import { HintIcon } from '../icons';
import type { I18nValue } from '../../types';
import type { MediaResolveContext } from '../../utils/media';
import styles from './Hint.module.scss';

/**
 * Hint + Solution reveal UI (spec §6.8).
 *
 * Pure UI over already-normalized question content. Visibility is PRESENCE-based —
 * an intentional deviation from Angular's section-flag gating (decided 2026-07-06,
 * superseding the earlier flag-gated behavior):
 * - "Show Hint" appears whenever the backend supplies hint content.
 * - "View Solution" appears whenever solution/answer content exists AND
 *   `canViewSolution` is true (learner has interacted).
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
  /** Media + offline resolution inputs so solution/hint assets resolve like the stem. */
  mediaCtx?: MediaResolveContext;
}

/**
 * Extract renderable HTML from a QuML hint/solution array entry.
 * The candidate may be a plain string or an I18nValue map (API form) — localize
 * via readI18n so both offline and fetched content render.
 */
function extractHtml(entry: unknown, language: string): string {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    const obj = entry as Record<string, unknown>;
    const candidate = obj.value ?? obj.body ?? obj.solution ?? obj.hint;
    if (typeof candidate === 'string') return candidate;
    if (candidate && typeof candidate === 'object') {
      return readI18n(candidate as I18nValue, language);
    }
  }
  return '';
}

export function Hint({
  hints = [],
  solutions = [],
  answer,
  canViewSolution = false,
  language = 'en',
  mediaCtx,
}: HintProps) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const hintHtml = hints.map((h) => extractHtml(h, language)).filter(Boolean);
  const solutionHtml = solutions.map((s) => extractHtml(s, language)).filter(Boolean);
  const answerText = readI18n(answer, language);

  // Hint button: presence-based — shows whenever the backend sent hint content.
  const hasHints = hintHtml.length > 0;
  // Solution button: the learner has interacted (canViewSolution) AND there is
  // solution/answer content to reveal.
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
            <QuestionBody key={i} question={{ body: html }} language={language} mediaCtx={mediaCtx} />
          ))}
        </div>
      )}

      {showSolution && hasSolution && (
        <div className={`${styles.panel} ${styles.solutionPanel}`}>
          <h3 className={styles.panelHeading}>{t(language, 'SOLUTION')}</h3>
          {solutionHtml.map((html, i) => (
            <QuestionBody key={i} question={{ body: html }} language={language} mediaCtx={mediaCtx} />
          ))}
          {solutionHtml.length === 0 && answerText && (
            <QuestionBody question={{ body: answerText }} language={language} mediaCtx={mediaCtx} />
          )}
        </div>
      )}
    </div>
  );
}
