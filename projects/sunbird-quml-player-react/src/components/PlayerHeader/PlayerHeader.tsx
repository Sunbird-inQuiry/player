import { useState } from 'react';
import { t } from '../../i18n/translations';
import { TimerIcon, MenuIcon } from '../icons';
import type { Section } from '../../types';
import styles from './PlayerHeader.module.scss';

/**
 * PlayerHeader — persistent assessment shell header (Phase 6 design).
 *
 * Pure presentational: brand + section step indicators (left) and timer, help,
 * global question counter, and Submit (right). All data is supplied by MainPlayer
 * from Context; intent is emitted via callbacks. No Context mutation.
 */
export interface PlayerHeaderProps {
  brand: string;
  sections: Section[];
  currentSectionIndex: number;
  completed: boolean[];
  /** Seconds remaining; null/omitted hides the timer. */
  timeRemaining?: number | null;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: () => void;
  onMenuClick?: () => void;
  /** Click the brand to return to the overview / start page. */
  onBrandClick?: () => void;
  language?: string;
}

function formatMmSs(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function PlayerHeader({
  brand,
  sections,
  currentSectionIndex,
  completed,
  timeRemaining = null,
  questionNumber,
  totalQuestions,
  onSubmit,
  onMenuClick,
  onBrandClick,
  language = 'en',
}: PlayerHeaderProps) {
  const showTimer = timeRemaining != null;
  const isTimeLow = showTimer && timeRemaining <= 60;
  const [showLegend, setShowLegend] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onMenuClick && (
          <button
            type="button"
            className={styles.menuBtn}
            onClick={onMenuClick}
            aria-label={t(language, 'OPEN_MENU')}
          >
            <MenuIcon size={20} />
          </button>
        )}

        <button
          type="button"
          className={styles.brand}
          onClick={onBrandClick}
          aria-label={`${brand} — ${t(language, 'ASSESSMENT_OVERVIEW')}`}
        >
          <span className={styles.brandBadge} aria-hidden="true">
            {brand.charAt(0).toUpperCase()}
          </span>
          <span className={styles.brandName}>{brand}</span>
        </button>

        <ol className={styles.steps} aria-label={t(language, 'SECTIONS')}>
          {sections.map((section, index) => {
            const status =
              index === currentSectionIndex
                ? 'active'
                : completed[index]
                  ? 'completed'
                  : 'upcoming';
            return (
              <li
                key={section.identifier}
                className={`${styles.step} ${styles[status]}`}
                aria-current={status === 'active' ? 'step' : undefined}
                title={section.name}
              >
                <span className={styles.stepDot}>{String.fromCharCode(65 + index)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={styles.right}>
        {showTimer && (
          <div
            className={`${styles.timer} ${isTimeLow ? styles.timerLow : ''}`.trim()}
            role="timer"
            aria-label={t(language, 'TIME_REMAINING')}
          >
            <TimerIcon size={16} />
            <span className={styles.timerValue}>{formatMmSs(timeRemaining)}</span>
          </div>
        )}

        <div className={styles.helpWrap}>
          <button
            type="button"
            className={styles.help}
            onClick={() => setShowLegend((s) => !s)}
            aria-label={t(language, 'HELP_LEGEND_TITLE')}
            aria-expanded={showLegend}
          >
            ?
          </button>

          {showLegend && (
            <>
              <div className={styles.legendBackdrop} onClick={() => setShowLegend(false)} />
              <div className={styles.legend} role="dialog" aria-label={t(language, 'HELP_LEGEND_TITLE')}>
                <p className={styles.legendTitle}>{t(language, 'HELP_LEGEND_TITLE')}</p>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.active}`} aria-hidden="true">A</span>
                  <span>{t(language, 'SECTION_CURRENT')}</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.completed}`} aria-hidden="true">A</span>
                  <span>{t(language, 'SECTION_DONE')}</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.upcoming}`} aria-hidden="true">B</span>
                  <span>{t(language, 'SECTION_UPCOMING')}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <span className={styles.counter}>
          {questionNumber}/{totalQuestions}
        </span>

        <button type="button" className={styles.submitBtn} onClick={onSubmit}>
          {t(language, 'SUBMIT')}
        </button>
      </div>
    </header>
  );
}
