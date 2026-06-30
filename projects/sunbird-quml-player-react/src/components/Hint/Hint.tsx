import { useState } from 'react';
import { t, readI18n } from '../../i18n/translations';
import { QuestionBody } from '../QuestionBody/QuestionBody';
import { HintIcon } from '../icons';
import type { I18nValue } from '../../types';
import styles from './Hint.module.scss';

/**
 * Hint + Solution reveal UI (spec §6.8).
 *
 * Pure UI over already-normalized question content: a "Show Hint" toggle for
 * `question.hints` and a "View Solution" toggle for `question.solutions` / the SA
 * `question.answer`. No scoring, no Context mutation. HTML/KaTeX content is
 * rendered through the shared QuestionBody.
 */
export interface HintProps {
  hints?: unknown[];
  solutions?: unknown[];
  /** SA model answer. */
  answer?: string | I18nValue;
  /** Gate the hint toggle (defaults to enabled). */
  showHints?: boolean;
  /** Gate the solution toggle (defaults to enabled). */
  showSolutions?: boolean;
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
  showHints = true,
  showSolutions = true,
  language = 'en',
}: HintProps) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const hintHtml = hints.map(extractHtml).filter(Boolean);
  const solutionHtml = solutions.map(extractHtml).filter(Boolean);
  const answerText = readI18n(answer, language);

  const hasHints = showHints && hintHtml.length > 0;
  const hasSolution = showSolutions && (solutionHtml.length > 0 || Boolean(answerText));

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
